/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { GuestbookModel } from '../models/guestbookModel';
import { HistoryModel } from '../models/historyModel';

export class GuestbookController {
  static async getPhotos(req: Request, res: Response): Promise<void> {
    try {
      const photos = await GuestbookModel.getAll();
      res.status(200).json(photos);
    } catch (err: any) {
      console.error('❌ Error in getPhotos Controller:', err);
      res.status(500).json({ error: 'Errore nel recupero dei ricordi del guestbook.', details: err.message });
    }
  }

  static async addPhoto(req: Request, res: Response): Promise<void> {
    try {
      const photo = req.body;
      if (!photo || !photo.url || !photo.uploader) {
        res.status(400).json({ error: 'Dati incompleti per la foto. Seleziona un file e inserisci un nome.' });
        return;
      }
      
      const newPhoto = {
        id: photo.id || Math.random().toString(36).substring(2, 11),
        url: photo.url,
        uploader: photo.uploader.trim(),
        caption: photo.caption ? photo.caption.trim() : undefined,
        timestamp: photo.timestamp || new Date().toISOString()
      };

      const added = await GuestbookModel.add(newPhoto);

      await HistoryModel.logEvent(
        'PHOTO_ADDED',
        `Foto Caricata: "${newPhoto.uploader}" ha condiviso un nuovo ricordo fotografico digitale nel Guestbook.`,
        { uploader: newPhoto.uploader, caption: newPhoto.caption }
      );

      res.status(201).json(added);
    } catch (err: any) {
      console.error('❌ Error in addPhoto Controller:', err);
      res.status(500).json({ error: 'Errore nel caricamento della foto.', details: err.message });
    }
  }

  static async deletePhoto(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: 'ID della foto assente.' });
        return;
      }

      const existingPhotos = await GuestbookModel.getAll();
      const targetPhoto = existingPhotos.find(p => p.id === id);
      const uploaderName = targetPhoto ? targetPhoto.uploader : 'Sconosciuto';

      const success = await GuestbookModel.delete(id);
      if (success) {
        await HistoryModel.logEvent(
          'PHOTO_DELETED',
          `Foto Rimossa: Il ricordo caricato da "${uploaderName}" è stato rimosso dall'amministratore.`,
          { uploader: uploaderName, id }
        );
        res.status(200).json({ success: true, message: 'Foto rimossa correttamente.' });
      } else {
        res.status(404).json({ error: 'Foto non trovata.' });
      }
    } catch (err: any) {
      console.error('❌ Error in deletePhoto Controller:', err);
      res.status(500).json({ error: 'Errore nella rimozione della foto.', details: err.message });
    }
  }
}
