/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs/promises';
import path from 'path';
import { GuestbookPhoto } from '../../src/types';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const FILE_PATH = path.join(DATA_DIR, 'wedding_photos.json');

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
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      try {
        await fs.access(FILE_PATH);
      } catch {
        await fs.writeFile(FILE_PATH, JSON.stringify(PRELOADED_PHOTOS, null, 2), 'utf-8');
        console.log('✅ Guestbook photos database seeded successfully.');
      }
    } catch (err) {
      console.error('❌ Error initializing guestbook photos directory:', err);
    }
  }

  static async getAll(): Promise<GuestbookPhoto[]> {
    await this.ensureInitialized();
    try {
      const data = await fs.readFile(FILE_PATH, 'utf-8');
      return JSON.parse(data) as GuestbookPhoto[];
    } catch {
      return PRELOADED_PHOTOS;
    }
  }

  static async add(photo: GuestbookPhoto): Promise<GuestbookPhoto> {
    const list = await this.getAll();
    list.unshift(photo);
    await fs.writeFile(FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    return photo;
  }

  static async delete(id: string): Promise<boolean> {
    const list = await this.getAll();
    const filtered = list.filter(p => p.id !== id);
    if (filtered.length !== list.length) {
      await fs.writeFile(FILE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    }
    return false;
  }
}
