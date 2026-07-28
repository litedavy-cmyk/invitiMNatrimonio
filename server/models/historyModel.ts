/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { readDataFile, writeDataFile, appendDataFile } from '../utils/dataStorage';

export interface HistoryEvent {
  id: string;
  timestamp: string;
  type: 'RSVP_CREATED' | 'RSVP_UPDATED' | 'RSVP_DELETED' | 'RSVP_CLEARED' | 'CONFIG_UPDATED' | 'PHOTO_ADDED' | 'PHOTO_DELETED' | 'ADMIN_ACCESS' | 'GUEST_LIST_UPLOADED' | 'SYSTEM_RESET';
  description: string;
  details?: any;
}

const JSON_FILE_NAME = 'modifications_history.json';
const TEXT_LOG_NAME = 'modifications_history.log';

export class HistoryModel {
  static async ensureInitialized(): Promise<void> {
    const rawJson = await readDataFile(JSON_FILE_NAME, '');
    if (!rawJson) {
      await writeDataFile(JSON_FILE_NAME, JSON.stringify([], null, 2));
    }

    const rawText = await readDataFile(TEXT_LOG_NAME, '');
    if (!rawText) {
      const initialHeader = `===================================================================\n` +
                            `📜 MATRIMONIO ALESSANDRO & BEATRICE - REGISTRO CRONOLOGICO MODIFICHE\n` +
                            `===================================================================\n` +
                            `Creato il: ${new Date().toLocaleString('it-IT')}\n\n`;
      await writeDataFile(TEXT_LOG_NAME, initialHeader);
    }
  }

  static async getHistory(): Promise<HistoryEvent[]> {
    try {
      const data = await readDataFile(JSON_FILE_NAME, '');
      if (!data) return [];
      return JSON.parse(data) as HistoryEvent[];
    } catch {
      return [];
    }
  }

  static async logEvent(
    type: HistoryEvent['type'],
    description: string,
    details?: any
  ): Promise<HistoryEvent> {
    const timestamp = new Date().toISOString();
    const formattedDate = new Date().toLocaleString('it-IT');
    const id = Math.random().toString(36).substring(2, 11);

    const event: HistoryEvent = {
      id,
      timestamp,
      type,
      description,
      details
    };

    try {
      // 1. Append to structured JSON
      const history = await this.getHistory();
      history.unshift(event); // Newest events first
      await writeDataFile(JSON_FILE_NAME, JSON.stringify(history, null, 2));

      // 2. Append to plain text log file (.log)
      const textLine = `[${formattedDate}] [${type}] ${description}\n${details ? `   Dettagli: ${JSON.stringify(details)}\n` : ''}\n`;
      await appendDataFile(TEXT_LOG_NAME, textLine);

      console.log(`📝 Logged audit event [${type}]: ${description}`);
    } catch (err) {
      console.error('❌ Fail to write audit log details:', err);
    }

    return event;
  }

  static async clearHistory(): Promise<void> {
    await writeDataFile(JSON_FILE_NAME, JSON.stringify([], null, 2));
    const resetHeader = `===================================================================\n` +
                        `📜 LOG RESET - Registro ricreato il: ${new Date().toLocaleString('it-IT')}\n` +
                        `===================================================================\n\n`;
    await writeDataFile(TEXT_LOG_NAME, resetHeader);
  }
}
