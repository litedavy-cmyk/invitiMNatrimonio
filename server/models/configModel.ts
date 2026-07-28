/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeddingConfig } from '../../src/types';
import { readDataFile, writeDataFile } from '../utils/dataStorage';

const FILE_NAME = 'wedding_config.json';

const DEFAULT_CONFIG: WeddingConfig = {
  sposoName: 'Alessandro',
  sposaName: 'Beatrice',
  weddingDate: '2026-09-12T15:30:00.000Z',
  welcomeMessage: 'Con grandissima gioia ed emozioni indescrivibili, vi invitiamo a condividere con noi il giorno più importante della nostra vita.',
  ourStory: 'Ci siamo incontrati per caso in una sera d\'autunno e, da quel momento, non abbiamo mai smetto di camminare fianco a fianco. Dopo anni colmi d\'amore, risate e viaggi indimenticabili, abbiamo deciso di pronunciare il nostro "Sì" definitivo e dare inizio a questa meravigliosa avventura nuziale.',
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

export class ConfigModel {
  static async ensureInitialized(): Promise<void> {
    const raw = await readDataFile(FILE_NAME, '');
    if (!raw) {
      await writeDataFile(FILE_NAME, JSON.stringify(DEFAULT_CONFIG, null, 2));
    }
  }

  static async get(): Promise<WeddingConfig> {
    try {
      const data = await readDataFile(FILE_NAME, '');
      if (!data) return DEFAULT_CONFIG;
      return JSON.parse(data) as WeddingConfig;
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  static async update(newConfig: WeddingConfig): Promise<WeddingConfig> {
    await writeDataFile(FILE_NAME, JSON.stringify(newConfig, null, 2));
    return newConfig;
  }
}
