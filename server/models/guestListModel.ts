/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GuestListEntry } from '../../src/types';
import { readDataFile, writeDataFile, removeDataFile } from '../utils/dataStorage';

const FILE_NAME = 'wedding_guest_list.json';
const METADATA_NAME = 'wedding_guest_list_metadata.json';

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
    const raw = await readDataFile(FILE_NAME, '');
    if (!raw) {
      await writeDataFile(FILE_NAME, JSON.stringify(DEFAULT_GUEST_LIST, null, 2));
    }
  }

  static async getAll(): Promise<GuestListEntry[]> {
    try {
      const data = await readDataFile(FILE_NAME, '');
      if (!data) return DEFAULT_GUEST_LIST;
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
    await writeDataFile(FILE_NAME, JSON.stringify(guests, null, 2));
    return guests;
  }

  static async getLastFilename(): Promise<string> {
    try {
      const data = await readDataFile(METADATA_NAME, '');
      if (!data) return '';
      const obj = JSON.parse(data);
      return obj.lastFilename || '';
    } catch {
      return '';
    }
  }

  static async saveLastFilename(filename: string): Promise<void> {
    await writeDataFile(METADATA_NAME, JSON.stringify({ lastFilename: filename }, null, 2));
  }

  static async clearList(): Promise<void> {
    await writeDataFile(FILE_NAME, JSON.stringify(DEFAULT_GUEST_LIST, null, 2));
    await removeDataFile(METADATA_NAME);
  }
}
