/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RSVPGuest } from '../../src/types';
import { readDataFile, writeDataFile } from '../utils/dataStorage';

const FILE_NAME = 'wedding_rsvps.json';

const SAMPLE_GUESTS: RSVPGuest[] = [
  {
    id: 'g1',
    name: 'Gianluca & Elena',
    attending: 'yes',
    menuPreference: 'Standard',
    dietaryRequirements: 'Elena ha un\'allergia severa alle nocciole',
    companions: [
      { id: 'c1', name: 'Piccolo Mattia', menuPreference: 'Menu Bambini', dietaryRequirements: 'Senza Lattosio' }
    ],
    weddingMessage: 'Siamo felicissimi per voi! Ci vediamo a Chiusdino!',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'g2',
    name: 'Zio Giovanni',
    attending: 'yes',
    menuPreference: 'Celiaco',
    dietaryRequirements: 'Celiachia rigorosa, no tracce glutine',
    companions: [],
    weddingMessage: 'Un abbraccio grande a tutta la famiglia, non vedo l\'ora!',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'g3',
    name: 'Giulia Bianchi',
    attending: 'no',
    menuPreference: 'Standard',
    dietaryRequirements: '',
    companions: [],
    weddingMessage: 'Sfortunatamente sarò in viaggio di lavoro all\'estero, ma brinderò a distanza di sicurezza!',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'g4',
    name: 'Alessandro De Angelis',
    attending: 'maybe',
    menuPreference: 'Standard',
    dietaryRequirements: '',
    companions: [
      { id: 'c2', name: 'Laura De Angelis', menuPreference: 'Vegetariano', dietaryRequirements: '' },
      { id: 'c3', name: 'Francesco De Angelis', menuPreference: 'Vegano', dietaryRequirements: '' }
    ],
    weddingMessage: 'Stiamo allineando ferie e voli da Londra, faremo di tutto per festeggiare insieme a voi!',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
  }
];

export class RsvpModel {
  static async ensureInitialized(): Promise<void> {
    const raw = await readDataFile(FILE_NAME, '');
    if (!raw) {
      await writeDataFile(FILE_NAME, JSON.stringify(SAMPLE_GUESTS, null, 2));
    }
  }

  static async getAll(): Promise<RSVPGuest[]> {
    try {
      const data = await readDataFile(FILE_NAME, '');
      if (!data) return SAMPLE_GUESTS;
      return JSON.parse(data) as RSVPGuest[];
    } catch {
      return SAMPLE_GUESTS;
    }
  }

  static async saveAll(rsvps: RSVPGuest[]): Promise<RSVPGuest[]> {
    await writeDataFile(FILE_NAME, JSON.stringify(rsvps, null, 2));
    return rsvps;
  }

  static async addOrUpdate(rsvp: RSVPGuest): Promise<RSVPGuest> {
    const list = await this.getAll();
    const idx = list.findIndex(g => g.name.trim().toLowerCase() === rsvp.name.trim().toLowerCase());
    if (idx >= 0) {
      list[idx] = { ...rsvp, id: list[idx].id }; // preserve ID or update
    } else {
      list.unshift(rsvp);
    }
    await this.saveAll(list);
    return rsvp;
  }

  static async delete(id: string): Promise<boolean> {
    const list = await this.getAll();
    const filtered = list.filter(g => g.id !== id);
    if (filtered.length !== list.length) {
      await this.saveAll(filtered);
      return true;
    }
    return false;
  }

  static async reset(): Promise<void> {
    await this.saveAll([]);
  }

  static async restoreSamples(): Promise<RSVPGuest[]> {
    await this.saveAll(SAMPLE_GUESTS);
    return SAMPLE_GUESTS;
  }
}
