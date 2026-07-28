/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Import MVC Database Initiators & Routes
import { ConfigModel } from './server/models/configModel';
import { RsvpModel } from './server/models/rsvpModel';
import { GuestbookModel } from './server/models/guestbookModel';
import { HistoryModel } from './server/models/historyModel';
import apiRoutes from './server/routes/apiRoutes';

// Configure dotenv with override to respect .env.example edits
dotenv.config({ path: path.join(process.cwd(), '.env.example'), override: true });
dotenv.config({ override: true });

const app = express();
const PORT = 3000;

// Standard middlewares
app.use(express.json({ limit: '50mb' })); // Support uploads up to 50MB (base64 image strings)
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Model Directories & Files
async function initializeDatabases() {
  try {
    console.log('📦 Starting MVC Database initialization...');
    await ConfigModel.ensureInitialized();
    await RsvpModel.ensureInitialized();
    await GuestbookModel.ensureInitialized();
    await HistoryModel.ensureInitialized();
    console.log('✅ All MVC Databases are initialized and ready!');
  } catch (err) {
    console.error('❌ Failed to initialize database seed files:', err);
  }
}

// Start Express server serving Vite and APIs
async function startServer() {
  // Pre-boot databases
  await initializeDatabases();

  // Mount MVC Router
  app.use('/api', apiRoutes);

  // Serve static files in production or run Vite dev-server middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Fullstack MVC Server] Booted successfully. Running on http://localhost:${PORT}`);
  });
}

startServer();
