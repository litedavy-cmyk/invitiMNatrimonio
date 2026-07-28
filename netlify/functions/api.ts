import express from 'express';
import serverless from 'serverless-http';
import dotenv from 'dotenv';
import path from 'path';

import { ConfigModel } from '../../server/models/configModel';
import { RsvpModel } from '../../server/models/rsvpModel';
import { GuestbookModel } from '../../server/models/guestbookModel';
import { HistoryModel } from '../../server/models/historyModel';
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
      isInit = true;
    } catch (err) {
      console.error('Error initializing databases in Netlify function:', err);
    }
  }
  next();
});

// Route /api and Netlify serverless prefix to API routes
app.use(['/api', '/.netlify/functions/api'], apiRoutes);

export const handler = serverless(app);
