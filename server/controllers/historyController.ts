/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { HistoryModel } from '../models/historyModel';

export class HistoryController {
  static async getHistoryList(req: Request, res: Response): Promise<void> {
    try {
      const history = await HistoryModel.getHistory();
      res.status(200).json(history);
    } catch (err: any) {
      console.error('❌ Error in getHistoryList Controller:', err);
      res.status(500).json({ error: 'Errore nel recupero della cronologia delle modifiche.', details: err.message });
    }
  }

  static async getPasswordHint(req: Request, res: Response): Promise<void> {
    try {
      const correctPlainPassword = (process.env.ADMIN_PASSWORD || 'sposi2026')
        .trim()
        .replace(/^['"]|['"]$/g, '');
      res.status(200).json({ password: correctPlainPassword || 'sposi2026' });
    } catch {
      res.status(250).json({ password: 'sposi2026' });
    }
  }

  static async logAdminLogin(req: Request, res: Response): Promise<void> {
    try {
      const { password } = req.body;
      if (!password) {
        res.status(401).json({ error: 'Password non fornita.' });
        return;
      }

      // Clean the incoming password by trimming any accidental leading/trailing spaces
      const incomingClean = String(password).trim();

      // Read configured plaintext environment variables or defaults, cleaning any potential quote enclosures or spaces
      let correctPlainPassword = (process.env.ADMIN_PASSWORD || 'sposi2026')
        .trim()
        .replace(/^['"]|['"]$/g, '');

      if (!correctPlainPassword) {
        correctPlainPassword = 'sposi2026';
      }
      
      // Calculate SHA-256 hash of the cleaned incoming password challenge
      const inputHash = crypto.createHash('sha256').update(incomingClean).digest('hex');

      // Check against optional pre-hashed environment variable or hash of fallback
      let configuredHash = process.env.ADMIN_PASSWORD_HASH ? process.env.ADMIN_PASSWORD_HASH.trim().replace(/^['"]|['"]$/g, '') : undefined;

      const matchesPlain = incomingClean.toLowerCase() === correctPlainPassword.toLowerCase();
      const matchesDefault = incomingClean.toLowerCase() === 'sposi2026';
      const matchesHash = configuredHash ? (inputHash.toLowerCase() === configuredHash.toLowerCase()) : false;

      // Diagnostic logging to aid in live debugging of authentication
      console.log('🔑 Admin Login Attempt:', {
        incoming: incomingClean,
        correctPlainPassword,
        matchesPlain,
        matchesDefault,
        matchesHash
      });

      // Allow login if matching either plaintext configuration, default password, OR cryptographic hash representation
      if (!matchesPlain && !matchesDefault && !matchesHash) {
        res.status(401).json({ error: 'Password non corretta. Per favore riprova.' });
        return;
      }

      await HistoryModel.logEvent(
        'ADMIN_ACCESS',
        `Accesso Sposi: Accesso eseguito con successo all'area riservata admin della coppia.`,
        { ip: req.ip || 'locale' }
      );
      res.status(200).json({ success: true });
    } catch (err: any) {
      console.error('❌ Error logging admin login:', err);
      res.status(500).json({ error: 'Errore durante la registrazione dell\'accesso.' });
    }
  }

  static async clearHistoryList(req: Request, res: Response): Promise<void> {
    try {
      await HistoryModel.clearHistory();
      res.status(200).json({ success: true, message: 'La cronologia delle modifiche è stata ripulita.' });
    } catch (err: any) {
      console.error('❌ Error in clearHistoryList Controller:', err);
      res.status(500).json({ error: 'Errore nel reset della cronologia.', details: err.message });
    }
  }

  static async getRawLog(req: Request, res: Response): Promise<void> {
    try {
      const logPath = path.join(process.cwd(), 'server', 'data', 'modifications_history.log');
      let logContent = '';
      try {
        logContent = await fs.readFile(logPath, 'utf-8');
      } catch {
        logContent = 'Nessun log registrato.';
      }
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="modifications_history.log"');
      res.status(200).send(logContent);
    } catch (err: any) {
      console.error('❌ Error reading raw log file:', err);
      res.status(500).send('Errore durante la lettura del file di log.');
    }
  }
}
