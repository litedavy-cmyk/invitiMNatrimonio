/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { GuestListModel } from '../models/guestListModel';
import { RsvpModel } from '../models/rsvpModel';
import { ConfigModel } from '../models/configModel';
import { HistoryModel } from '../models/historyModel';

export class GuestListController {
  static async getGuestList(req: Request, res: Response): Promise<void> {
    try {
      const list = await GuestListModel.getAll();
      res.status(200).json(list);
    } catch (err: any) {
      console.error('❌ Error in getGuestList Controller:', err);
      res.status(500).json({ error: 'Errore nel caricamento della lista degli invitati.', details: err.message });
    }
  }

  static async uploadGuestList(req: Request, res: Response): Promise<void> {
    try {
      let guests: any[] = [];
      let fileName: string = '';

      if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
        guests = req.body.guests || [];
        fileName = req.body.fileName || '';
      } else if (Array.isArray(req.body)) {
        guests = req.body;
      }

      if (!guests || !Array.isArray(guests) || guests.length === 0) {
        res.status(400).json({ error: 'La lista degli invitati JSON non può essere vuota.' });
        return;
      }

      const currentList = await GuestListModel.getAll();

      // Format and parse incoming JSON guests
      const parsedGuests: typeof currentList = guests.map((g: any, index: number) => {
        const nome = String(g.nome || g.NOME || g.NAME || '').trim();
        const cognome = String(g.cognome || g.COGNOME || g.SURNAME || '').trim();
        const cell = String(g.cell || g.CELL || g.PHONE || g.TELEFONO || '').trim();
        const email = String(g.email || g.EMAIL || g.MAIL || '').trim();
        return {
          id: g.id || `gl_json_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
          nome,
          cognome,
          cell,
          email
        };
      }).filter(g => g.nome !== '' || g.cognome !== '');

      if (parsedGuests.length === 0) {
        res.status(400).json({ error: 'Nessun invitato valido con Nome o Cognome trovato nel JSON.' });
        return;
      }

      // De-duplicate incoming array by normalized Nome + Cognome
      const normalizeName = (str: string) => {
        return (str || '')
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      };

      const finalGuests: typeof currentList = [];
      const seenKeys = new Set<string>();

      parsedGuests.forEach(g => {
        const key = `${normalizeName(g.nome)}|${normalizeName(g.cognome)}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          finalGuests.push(g);
        }
      });

      // Completely replace stored list in app memory (wedding_guest_list.json)
      await GuestListModel.saveAll(finalGuests);

      if (fileName) {
        await GuestListModel.saveLastFilename(fileName);
      }

      const syncMessage = `Elenco invitati JSON aggiornato e memorizzato in app (${finalGuests.length} invitati totali).`;

      await HistoryModel.logEvent(
        'GUEST_LIST_UPLOADED',
        syncMessage,
        {
          total: finalGuests.length,
          previousTotal: currentList.length,
          fileName
        }
      );

      res.status(200).json({
        success: true,
        list: finalGuests,
        summary: {
          total: finalGuests.length,
          added: finalGuests.length,
          updated: 0,
          isOverwritten: true,
          fileName
        }
      });
    } catch (err: any) {
      console.error('❌ Error in uploadGuestList Controller:', err);
      res.status(500).json({ error: 'Errore durante il salvataggio della lista invitati JSON.', details: err.message });
    }
  }

  static async systemReset(req: Request, res: Response): Promise<void> {
    try {
      // 1. Reset Guest list to DEFAULT_GUEST_LIST
      await GuestListModel.clearList();

      // 2. Reset RSVPs to []
      await RsvpModel.reset();

      // 3. Reset history logs to []
      await HistoryModel.clearHistory();

      // 4. Force default wedding config
      const DEFAULT_CONFIG = {
        sposoName: 'Alessandro',
        sposaName: 'Beatrice',
        weddingDate: '2026-09-12T15:30:00.000Z',
        welcomeMessage: 'Con grandissima gioia ed emozioni indescrivibili, vi invitiamo a condividere con noi il giorno più importante della nostra vita.',
        ourStory: 'Ci siamo incontrati per caso in una sera d\'autunno e, da quel momento, non abbiamo mai smesso di camminare fianco a fianco. Dopo anni colmi d\'amore, risate e viaggi indimenticabili, abbiamo deciso di pronunciare il nostro "Sì" definitivo e dare inizio a questa meravigliosa avventura nuziale.',
        venueCeremony: {
          name: 'Abbazia di San Galgano',
          address: 'Strada Comunale di San Galgano, 53012 Chiusdino SI, Italia',
          time: '15:30',
          latitude: 43.1492,
          longitude: 11.1541,
          description: 'La nostra cerimonia civile si terrà nella suggestiva cornice dell\'abbazia cistercense del XIII secolo, celebre per essere rimasta senza tetto, dove il cielo fa da soffitto all\'amore.',
        },
        venueReception: {
          name: 'Villa Catignano',
          address: 'Via Catignano 14, 53019 Castelnuovo Berardenga SI, Italia',
          time: '18:00',
          latitude: 43.3444,
          longitude: 11.3787,
          description: 'A seguire, saremo felici di festeggiare con aperitivi, cena tipica toscana, brindisi e balli nei giardini all\'italiana e nella corte storica di questa magnifica residenza del XVII secolo.',
        }
      };
      await ConfigModel.update(DEFAULT_CONFIG);

      // Log the system reset to history log
      await HistoryModel.logEvent(
        'SYSTEM_RESET',
        `Reset di Sistema: Il software è stato riportato con successo al punto di partenza. Lista invitati di prova ricaricata, risposte cancellate e config reimpostata.`,
        {}
      );

      res.status(200).json({ success: true, message: 'Reset di sistema completato con successo.' });
    } catch (err: any) {
      console.error('❌ Error in systemReset Controller:', err);
      res.status(500).json({ error: 'Errore durante il reset totale del sistema.', details: err.message });
    }
  }
}
