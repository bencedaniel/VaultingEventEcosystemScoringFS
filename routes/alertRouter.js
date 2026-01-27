import express from 'express';

import { Verify, VerifyRole } from "../middleware/Verify.js";
import * as alertController from '../controllers/alertController.js';

const alertRouter = express.Router();

// ===========================
// ALERTS MANAGEMENT
// ===========================

alertRouter.get('/new', Verify, VerifyRole(), alertController.getNewAlertForm);
alertRouter.post('/new', Verify, VerifyRole(), alertController.createNewAlertHandler);
alertRouter.get('/dashboard', Verify, VerifyRole(), alertController.getAlertsDashboard);
alertRouter.get('/edit/:id', Verify, VerifyRole(), alertController.getEditAlertForm);
alertRouter.post('/edit/:id', Verify, VerifyRole(), alertController.updateAlertHandler);
alertRouter.delete('/delete/:id', Verify, VerifyRole(), alertController.deleteAlertHandler);
alertRouter.get('/checkEvent/', Verify, VerifyRole(), alertController.checkEventAlertsHandler);

export default alertRouter;