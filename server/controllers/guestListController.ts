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
        res.status(400).json({ error: 'La lista degli invitati non può essere vuota o nulla.' });
        return;
      }

      // Read current guest list and previous filename
      const currentList = await GuestListModel.getAll();
      const previousFilename = await GuestListModel.getLastFilename();

      const hasPreviousFile = previousFilename !== '';
      const isNewFilename = hasPreviousFile && fileName !== '' && fileName !== previousFilename;

      let isOverwritten = false;
      let effectiveCurrentList = currentList;

      if (isNewFilename) {
        effectiveCurrentList = []; // Ignore existing list for matching, treats all as new additions
        isOverwritten = true;
      }

      // Normalize name helper for matching: lowercases, removes accents, extracts alphanumeric tokens
      const normalizeName = (name: string) => {
        return name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // remove accents
          .replace(/[^a-z0-9]/g, " ")       // replace special characters with spaces
          .replace(/\s+/g, " ")             // collapse multi-spaces
          .trim();
      };

      // Index effective list by normalized "nome|cognome"
      const currentMap = new Map<string, typeof currentList[0]>();
      effectiveCurrentList.forEach(g => {
        const key = `${normalizeName(g.nome)}|${normalizeName(g.cognome)}`;
        if (key && !currentMap.has(key)) {
          currentMap.set(key, g);
        }
      });

      // Format and parse incoming guests
      const incomingGuests = guests.map((g: any) => ({
        nome: String(g.nome || g.NOME || '').trim(),
        cognome: String(g.cognome || g.COGNOME || '').trim(),
        cell: String(g.cell || g.CELL || '').trim(),
        email: String(g.email || g.EMAIL || '').trim(),
      })).filter(g => g.nome !== '' || g.cognome !== '');

      if (incomingGuests.length === 0) {
        res.status(400).json({ error: 'Nessun invitato valido (con Nome o Cognome) trovato nella lista.' });
        return;
      }

      const finalGuests: typeof currentList = [];
      const processedIncomingKeys = new Set<string>();

      let addedCount = 0;
      let updatedCount = 0;
      let keptCount = 0;

      // 1. Process incoming list
      incomingGuests.forEach((g, index) => {
        const key = `${normalizeName(g.nome)}|${normalizeName(g.cognome)}`;
        if (processedIncomingKeys.has(key)) {
          // Skip subsequent duplicate rows in the uploaded spreadsheet
          return;
        }
        processedIncomingKeys.add(key);

        const existing = currentMap.get(key);
        if (existing) {
          // Check if contact info has changed
          const hasChanged = existing.cell !== g.cell || existing.email !== g.email;
          if (hasChanged) {
            updatedCount++;
          } else {
            keptCount++;
          }

          finalGuests.push({
            id: existing.id,
            nome: existing.nome, // Keep original casing/naming
            cognome: existing.cognome,
            cell: g.cell || existing.cell,
            email: g.email || existing.email,
          });
        } else {
          // New guest addition!
          addedCount++;
          finalGuests.push({
            id: `gl_upload_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 5)}`,
            nome: g.nome,
            cognome: g.cognome,
            cell: g.cell,
            email: g.email,
          });
        }
      });

      // Calculate deleted count
      let deletedCount = 0;
      if (isOverwritten) {
        deletedCount = currentList.length;
      } else {
        const deletedGuests = currentList.filter(cg => {
          const key = `${normalizeName(cg.nome)}|${normalizeName(cg.cognome)}`;
          return !processedIncomingKeys.has(key);
        });
        deletedCount = deletedGuests.length;
      }

      // Persist the unified synced guest list
      await GuestListModel.saveAll(finalGuests);

      // Persist the new filename metadata if provided
      if (fileName) {
        await GuestListModel.saveLastFilename(fileName);
      }

      // Log detailed history event of synchronization
      let syncMessage = '';
      if (isOverwritten) {
        syncMessage = `Lista Sostituita Interamente (File differente rilevato: "${fileName}" risp. a "${previousFilename}"). Caricati ${finalGuests.length} invitati totali, rimossi tutti i ${currentList.length} precedenti.`;
      } else {
        syncMessage = `Lista Sincronizzata (Stesso file rilevato: "${fileName || 'Excel/CSV'}"). Caricati ${finalGuests.length} invitati totali.`;
        if (addedCount > 0 || deletedCount > 0 || updatedCount > 0) {
          syncMessage += ` Variazioni: +${addedCount} aggiunti, -${deletedCount} rimossi, ~${updatedCount} aggiornati, ${keptCount} invariati.`;
        } else {
          syncMessage += ` Nessuna variazione rilevata.`;
        }
      }

      await HistoryModel.logEvent(
        'GUEST_LIST_UPLOADED',
        syncMessage,
        {
          total: finalGuests.length,
          added: addedCount,
          deleted: deletedCount,
          updated: updatedCount,
          kept: keptCount,
          fileName,
          isOverwritten
        }
      );

      res.status(200).json({
        success: true,
        list: finalGuests,
        summary: {
          total: finalGuests.length,
          added: addedCount,
          deleted: deletedCount,
          updated: updatedCount,
          kept: keptCount,
          isOverwritten,
          fileName,
          previousFilename
        }
      });
    } catch (err: any) {
      console.error('❌ Error in uploadGuestList Controller:', err);
      res.status(500).json({ error: 'Errore durante la sincronizzazione della lista caricata.', details: err.message });
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
