/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { ConfigModel } from '../models/configModel';
import { HistoryModel } from '../models/historyModel';

export class ConfigController {
  static async getConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = await ConfigModel.get();
      res.status(200).json(config);
    } catch (err: any) {
      console.error('❌ Error in getConfig Controller:', err);
      res.status(500).json({ error: 'Errore nel recupero della configurazione.', details: err.message });
    }
  }

  static async updateConfig(req: Request, res: Response): Promise<void> {
    try {
      const newConfig = req.body;
      if (!newConfig || !newConfig.sposoName || !newConfig.sposaName) {
        res.status(400).json({ error: 'Dati di configurazione non validi o mancanti.' });
        return;
      }
      const updated = await ConfigModel.update(newConfig);
      
      await HistoryModel.logEvent(
        'CONFIG_UPDATED',
        `Configurazione Aggiornata: Le impostazioni del matrimonio (nomi, data o location) sono state aggiornate dal pannello Sposi.`,
        { sposo: newConfig.sposoName, sposa: newConfig.sposaName, date: newConfig.weddingDate }
      );

      res.status(200).json(updated);
    } catch (err: any) {
      console.error('❌ Error in updateConfig Controller:', err);
      res.status(500).json({ error: 'Errore nel salvare la configurazione.', details: err.message });
    }
  }
}
