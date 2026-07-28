/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs/promises';
import path from 'path';
import { WeddingConfig } from '../../src/types';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const FILE_PATH = path.join(DATA_DIR, 'wedding_config.json');

const DEFAULT_CONFIG: WeddingConfig = {
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

export class ConfigModel {
  static async ensureInitialized(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      try {
        await fs.access(FILE_PATH);
      } catch {
        // File does not exist, write default config
        await fs.writeFile(FILE_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
        console.log('✅ Wedding config database seeded successfully.');
      }
    } catch (err) {
      console.error('❌ Error initializing config data directory:', err);
    }
  }

  static async get(): Promise<WeddingConfig> {
    await this.ensureInitialized();
    try {
      const data = await fs.readFile(FILE_PATH, 'utf-8');
      return JSON.parse(data) as WeddingConfig;
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  static async update(newConfig: WeddingConfig): Promise<WeddingConfig> {
    await this.ensureInitialized();
    await fs.writeFile(FILE_PATH, JSON.stringify(newConfig, null, 2), 'utf-8');
    return newConfig;
  }
}
