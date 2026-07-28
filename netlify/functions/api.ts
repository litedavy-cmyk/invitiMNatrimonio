import express from 'express';
import serverless from 'serverless-http';
import dotenv from 'dotenv';
import path from 'path';

import { ConfigModel } from '../../server/models/configModel';
import { RsvpModel } from '../../server/models/rsvpModel';
import { GuestbookModel } from '../../server/models/guestbookModel';
import { HistoryModel } from '../../server/models/historyModel';
import { GuestListModel } from '../../server/models/guestListModel';
import apiRoutes from '../../server/routes/apiRoutes';

dotenv.config({ path: path.join(process.cwd(), '.env.example'), override: true });
dotenv.config({ override: true });

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

let isInit = false;
app.use(async (_req, _res, next) => {
  if (!isInit) {
    try {
      await ConfigModel.ensureInitialized();
      await RsvpModel.ensureInitialized();
      await GuestbookModel.ensureInitialized();
      await HistoryModel.ensureInitialized();
      await GuestListModel.ensureInitialized();
      isInit = true;
    } catch (err) {
      console.error('Error initializing databases in Netlify function:', err);
    }
  }
  next();
});

// Middleware to normalize request URL prefix for Netlify serverless routing
app.use((req, _res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '') || '/';
  } else if (req.url.startsWith('/api')) {
    req.url = req.url.replace('/api', '') || '/';
  }
  next();
});

// Route normalized API requests to apiRoutes
app.use('/', apiRoutes);

// Catch 404 for API routes and return JSON
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint API non trovato su Netlify' });
});

// Global error handler returning JSON instead of HTML error pages
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Netlify API Error:', err);
  res.status(500).json({ error: err?.message || 'Errore interno del server serverless.' });
});

export const handler = serverless(app);
