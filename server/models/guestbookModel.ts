/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GuestbookPhoto } from '../../src/types';
import { readDataFile, writeDataFile } from '../utils/dataStorage';

const FILE_NAME = 'wedding_photos.json';

const PRELOADED_PHOTOS: GuestbookPhoto[] = [
  {
    id: 'p1',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop',
    uploader: 'Testimone Marco',
    caption: 'La splendida atmosfera dell\'Abbazia di San Galgano! Un posto magico per iniziare questo viaggio.',
    timestamp: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'p2',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&auto=format&fit=crop',
    uploader: 'Chiara Spose',
    caption: 'I tavoli imbanditi e i profumi toscani a Villa Catignano! Pronte per i balli!',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];

export class GuestbookModel {
  static async ensureInitialized(): Promise<void> {
    const raw = await readDataFile(FILE_NAME, '');
    if (!raw) {
      await writeDataFile(FILE_NAME, JSON.stringify(PRELOADED_PHOTOS, null, 2));
    }
  }

  static async getAll(): Promise<GuestbookPhoto[]> {
    try {
      const data = await readDataFile(FILE_NAME, '');
      if (!data) return PRELOADED_PHOTOS;
      return JSON.parse(data) as GuestbookPhoto[];
    } catch {
      return PRELOADED_PHOTOS;
    }
  }

  static async add(photo: GuestbookPhoto): Promise<GuestbookPhoto> {
    const list = await this.getAll();
    list.unshift(photo);
    await writeDataFile(FILE_NAME, JSON.stringify(list, null, 2));
    return photo;
  }

  static async delete(id: string): Promise<boolean> {
    const list = await this.getAll();
    const filtered = list.filter(p => p.id !== id);
    if (filtered.length !== list.length) {
      await writeDataFile(FILE_NAME, JSON.stringify(filtered, null, 2));
      return true;
    }
    return false;
  }
}
