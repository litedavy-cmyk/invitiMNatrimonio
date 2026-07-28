/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs/promises';
import path from 'path';

export interface HistoryEvent {
  id: string;
  timestamp: string;
  type: 'RSVP_CREATED' | 'RSVP_UPDATED' | 'RSVP_DELETED' | 'RSVP_CLEARED' | 'CONFIG_UPDATED' | 'PHOTO_ADDED' | 'PHOTO_DELETED' | 'ADMIN_ACCESS' | 'GUEST_LIST_UPLOADED' | 'SYSTEM_RESET';
  description: string;
  details?: any;
}

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const JSON_FILE_PATH = path.join(DATA_DIR, 'modifications_history.json');
const TEXT_LOG_PATH = path.join(DATA_DIR, 'modifications_history.log');

export class HistoryModel {
  static async ensureInitialized(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      
      // Ensure JSON file exists
      try {
        await fs.access(JSON_FILE_PATH);
      } catch {
        await fs.writeFile(JSON_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
      }

      // Ensure Text Log file exists
      try {
        await fs.access(TEXT_LOG_PATH);
      } catch {
        const initialHeader = `===================================================================\n` +
                              `📜 MATRIMONIO ALESSANDRO & BEATRICE - REGISTRO CRONOLOGICO MODIFICHE\n` +
                              `===================================================================\n` +
                              `Creato il: ${new Date().toLocaleString('it-IT')}\n\n`;
        await fs.writeFile(TEXT_LOG_PATH, initialHeader, 'utf-8');
      }
    } catch (err) {
      console.error('❌ Error initializing modification history repository:', err);
    }
  }

  static async getHistory(): Promise<HistoryEvent[]> {
    await this.ensureInitialized();
    try {
      const data = await fs.readFile(JSON_FILE_PATH, 'utf-8');
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
    await this.ensureInitialized();
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
      await fs.writeFile(JSON_FILE_PATH, JSON.stringify(history, null, 2), 'utf-8');

      // 2. Append to plain text log file (.log)
      const textLine = `[${formattedDate}] [${type}] ${description}\n${details ? `   Dettagli: ${JSON.stringify(details)}\n` : ''}\n`;
      await fs.appendFile(TEXT_LOG_PATH, textLine, 'utf-8');

      console.log(`📝 Logged audit event [${type}]: ${description}`);
    } catch (err) {
      console.error('❌ Fail to write audit log details:', err);
    }

    return event;
  }

  static async clearHistory(): Promise<void> {
    await this.ensureInitialized();
    await fs.writeFile(JSON_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    const resetHeader = `===================================================================\n` +
                        `📜 LOG RESET - Registro ricreato il: ${new Date().toLocaleString('it-IT')}\n` +
                        `===================================================================\n\n`;
    await fs.writeFile(TEXT_LOG_PATH, resetHeader, 'utf-8');
  }
}
