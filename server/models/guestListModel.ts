/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs/promises';
import path from 'path';
import { GuestListEntry } from '../../src/types';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const FILE_PATH = path.join(DATA_DIR, 'wedding_guest_list.json');
const METADATA_PATH = path.join(DATA_DIR, 'wedding_guest_list_metadata.json');

// Default guest list to ensure it's NEVER null or empty
const DEFAULT_GUEST_LIST: GuestListEntry[] = [
  { id: 'gl1', nome: 'Gianluca', cognome: 'Rossi', cell: '+39 333 1122334', email: 'gianluca.rossi@example.com' },
  { id: 'gl2', nome: 'Elena', cognome: 'Bianchi', cell: '+39 347 5566778', email: 'elena.bianchi@example.com' },
  { id: 'gl3', nome: 'Zio', cognome: 'Giovanni', cell: '+39 312 9988776', email: 'giovanni.zio@example.com' },
  { id: 'gl4', nome: 'Giulia', cognome: 'Bianchi', cell: '+39 339 4455667', email: 'giulia.bianchi@example.com' },
  { id: 'gl5', nome: 'Alessandro', cognome: 'De Angelis', cell: '+39 328 1112223', email: 'alessandro.deangelis@example.com' },
  { id: 'gl6', nome: 'Laura', cognome: 'De Angelis', cell: '+39 328 4445556', email: 'laura.deangelis@example.com' },
  { id: 'gl7', nome: 'Francesco', cognome: 'De Angelis', cell: '+39 328 7778889', email: 'francesco.deangelis@example.com' },
  { id: 'gl8', nome: 'Marco', cognome: 'Ferrari', cell: '+39 345 8899001', email: 'marco.ferrari@example.com' },
  { id: 'gl9', nome: 'Sofia', cognome: 'Ricci', cell: '+39 331 2233445', email: 'sofia.ricci@example.com' }
];

export class GuestListModel {
  static async ensureInitialized(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      try {
        await fs.access(FILE_PATH);
      } catch {
        // If file doesn't exist, seed with default guest list
        await fs.writeFile(FILE_PATH, JSON.stringify(DEFAULT_GUEST_LIST, null, 2), 'utf-8');
        console.log('✅ Guest list seeded successfully with default list.');
      }
    } catch (err) {
      console.error('❌ Error initializing guest list data directory:', err);
    }
  }

  static async getAll(): Promise<GuestListEntry[]> {
    await this.ensureInitialized();
    try {
      const data = await fs.readFile(FILE_PATH, 'utf-8');
      const list = JSON.parse(data) as GuestListEntry[];
      if (!list || list.length === 0) {
        return DEFAULT_GUEST_LIST;
      }
      return list;
    } catch {
      return DEFAULT_GUEST_LIST;
    }
  }

  static async saveAll(guests: GuestListEntry[]): Promise<GuestListEntry[]> {
    if (!guests || guests.length === 0) {
      throw new Error('La lista degli invitati non può essere vuota o nulla.');
    }
    await this.ensureInitialized();
    await fs.writeFile(FILE_PATH, JSON.stringify(guests, null, 2), 'utf-8');
    return guests;
  }

  static async getLastFilename(): Promise<string> {
    try {
      const data = await fs.readFile(METADATA_PATH, 'utf-8');
      const obj = JSON.parse(data);
      return obj.lastFilename || '';
    } catch {
      return '';
    }
  }

  static async saveLastFilename(filename: string): Promise<void> {
    await this.ensureInitialized();
    await fs.writeFile(METADATA_PATH, JSON.stringify({ lastFilename: filename }, null, 2), 'utf-8');
  }

  static async clearList(): Promise<void> {
    await this.ensureInitialized();
    // Overwrite with default list to satisfy "la lista non può essere nulla" or empty Array?
    // Let's seed back defaults when we reset, or let's reset to default list.
    await fs.writeFile(FILE_PATH, JSON.stringify(DEFAULT_GUEST_LIST, null, 2), 'utf-8');
    try {
      await fs.unlink(METADATA_PATH);
    } catch {
      // ignore
    }
  }
}
