/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { ConfigController } from '../controllers/configController';
import { RsvpController } from '../controllers/rsvpController';
import { GuestbookController } from '../controllers/guestbookController';
import { HistoryController } from '../controllers/historyController';
import { GuestListController } from '../controllers/guestListController';

const router = Router();

// 1. Wedding Config Routes
router.get('/config', ConfigController.getConfig);
router.post('/config', ConfigController.updateConfig);

// 2. RSVP Guest Routes
router.get('/rsvps', RsvpController.getRSVPs);
router.post('/rsvp', RsvpController.submitRSVPs);
router.delete('/rsvp/:id', RsvpController.deleteRSVP);
router.post('/rsvps/clear', RsvpController.clearRSVPs);
router.post('/rsvps/samples', RsvpController.addSampleRSVPs);

// 3. Guest List Routes
router.get('/guest-list', GuestListController.getGuestList);
router.post('/guest-list', GuestListController.uploadGuestList);
router.post('/system/reset', GuestListController.systemReset);


// 3. Guestbook Photos Routes
router.get('/guestbook', GuestbookController.getPhotos);
router.post('/guestbook', GuestbookController.addPhoto);
router.delete('/guestbook/:id', GuestbookController.deletePhoto);

// 4. Activity History Logs Routes
router.get('/history', HistoryController.getHistoryList);
router.get('/history/password-hint', HistoryController.getPasswordHint);
router.get('/history/log', HistoryController.getRawLog);
router.post('/history/login', HistoryController.logAdminLogin);
router.post('/history/clear', HistoryController.clearHistoryList);

export default router;
