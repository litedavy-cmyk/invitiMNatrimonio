/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { RsvpModel } from '../models/rsvpModel';
import { HistoryModel } from '../models/historyModel';
import { GuestListModel } from '../models/guestListModel';

export class RsvpController {
  static async getRSVPs(req: Request, res: Response): Promise<void> {
    try {
      const list = await RsvpModel.getAll();
      res.status(200).json(list);
    } catch (err: any) {
      console.error('❌ Error in getRSVPs Controller:', err);
      res.status(500).json({ error: 'Errore nel caricamento delle risposte RSVP.', details: err.message });
    }
  }

  static async submitRSVPs(req: Request, res: Response): Promise<void> {
    try {
      const rsvp = req.body;

      if (!rsvp || !rsvp.name) {
        res.status(400).json({ error: 'Dati incompleti o mancanti.' });
        return;
      }

      // 0. Verify against pre-loaded guest list
      const guestList = await GuestListModel.getAll();
      const inputName = rsvp.name.trim().toLowerCase();

      const matchingGuest = guestList.find(e => {
        const fullNormal = `${e.nome.trim()} ${e.cognome.trim()}`.toLowerCase();
        const fullReverse = `${e.cognome.trim()} ${e.nome.trim()}`.toLowerCase();
        return fullNormal === inputName || fullReverse === inputName;
      });

      if (!matchingGuest) {
        res.status(403).json({ 
          error: 'Il nominativo inserito non corrisponde ad alcun invitato presente sulla nostra lista ospiti ufficiale.', 
          details: 'Per ragioni organizzative, solo gli invitati in elenco possono compilare l\'RSVP. Verifica la digitazione (es. "Nome Cognome") o contatta gli Sposi.' 
        });
        return;
      }

      // Detect if registration exists to log either confirmation or modification
      const existingList = await RsvpModel.getAll();
      const alreadyExists = existingList.some(g => g.name.trim().toLowerCase() === rsvp.name.trim().toLowerCase());

      // 1. Save locally inside Model Database first so it exists instantly on server
      const savedRSVP = await RsvpModel.addOrUpdate(rsvp);

      // Log the event
      const attendingText = rsvp.attending === 'yes' ? 'Sì, Partecipo!' : rsvp.attending === 'maybe' ? 'In forse' : 'Non posso partecipare';
      if (alreadyExists) {
        await HistoryModel.logEvent(
          'RSVP_UPDATED',
          `Presenza modificata: "${rsvp.name}" ha aggiornato il modulo RSVP in "${attendingText}".`,
          { name: rsvp.name, attending: rsvp.attending, menuPreference: rsvp.menuPreference, companionsCount: rsvp.companions?.length || 0 }
        );
      } else {
        await HistoryModel.logEvent(
          'RSVP_CREATED',
          `Nuova Risposta! "${rsvp.name}" si è registrato all'evento con risposta "${attendingText}".`,
          { name: rsvp.name, attending: rsvp.attending, menuPreference: rsvp.menuPreference, companionsCount: rsvp.companions?.length || 0 }
        );
      }

      res.status(200).json({ success: true, saved: savedRSVP, message: 'La tua risposta è stata registrata correttamente nel nostro database!' });

    } catch (err: any) {
      console.error('❌ Error submitting RSVP:', err);
      res.status(500).json({ error: 'Errore durante la registrazione della risposta.', details: err.message });
    }
  }

  static async deleteRSVP(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: 'ID assente.' });
        return;
      }

      const existingList = await RsvpModel.getAll();
      const targetGuest = existingList.find(g => g.id === id);
      const guestName = targetGuest ? targetGuest.name : 'Ospite Sconosciuto';

      const success = await RsvpModel.delete(id);
      if (success) {
        await HistoryModel.logEvent(
          'RSVP_DELETED',
          `Eliminazione Ospite: L'ospite "${guestName}" è stato rimosso dalla lista dal pannello admin.`,
          { name: guestName, id }
        );
        res.status(200).json({ success: true, message: 'Risposta rimossa correttamente.' });
      } else {
        res.status(404).json({ error: 'Ospite non trovato.' });
      }
    } catch (err: any) {
      console.error('❌ Error in deleteRSVP Controller:', err);
      res.status(500).json({ error: 'Errore durante l\'eliminazione dell\'ospite.', details: err.message });
    }
  }

  static async clearRSVPs(req: Request, res: Response): Promise<void> {
    try {
      await RsvpModel.reset();
      await HistoryModel.logEvent(
        'RSVP_CLEARED',
        `Svuotamento Lista: Tutte le risposte degli invitati sono state rimosse definitivamente.`,
        {}
      );
      res.status(200).json({ success: true, message: 'La lista RSVP è stata svuotata con successo.' });
    } catch (err: any) {
      console.error('❌ Error in clearRSVPs Controller:', err);
      res.status(500).json({ error: 'Errore durante il reset della lista ospiti.', details: err.message });
    }
  }

  static async addSampleRSVPs(req: Request, res: Response): Promise<void> {
    try {
      const list = await RsvpModel.restoreSamples();
      await HistoryModel.logEvent(
        'RSVP_CLEARED',
        `Ripristino Dati: Sono stati caricati gli ospiti di esempio predefiniti.`,
        {}
      );
      res.status(200).json({ success: true, list });
    } catch (err: any) {
      console.error('❌ Error in addSampleRSVPs Controller:', err);
      res.status(500).json({ error: 'Errore nel caricamento degli ospiti di esempio.', details: err.message });
    }
  }
}
