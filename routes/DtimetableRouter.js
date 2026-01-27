import express from 'express';

import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import DailyTimeTableController from '../controllers/dailyTimetableController.js';

const dailytimetableRouter = express.Router();

dailytimetableRouter.get('/new', Verify, VerifyRole(), DailyTimeTableController.renderNew);

dailytimetableRouter.post('/new', Verify, VerifyRole(), Validate, DailyTimeTableController.createNew);

dailytimetableRouter.get('/dashboard', Verify, VerifyRole(), DailyTimeTableController.dashboard);

dailytimetableRouter.get('/details/:id', Verify, VerifyRole(), DailyTimeTableController.details);

dailytimetableRouter.get('/edit/:id', Verify, VerifyRole(), DailyTimeTableController.editGet);

dailytimetableRouter.post('/edit/:id', Verify, VerifyRole(), Validate, DailyTimeTableController.editPost);

dailytimetableRouter.delete('/delete/:id', Verify, VerifyRole(), DailyTimeTableController.delete);

dailytimetableRouter.get('/dayparts/:id', Verify, VerifyRole(), DailyTimeTableController.dayparts);

dailytimetableRouter.delete('/deleteTTelement/:id', Verify, VerifyRole(), DailyTimeTableController.deleteTTelement);

dailytimetableRouter.get('/editTTelement/:id', Verify, VerifyRole(), DailyTimeTableController.editTTelementGet);

dailytimetableRouter.post('/editTTelement/:id', Verify, VerifyRole(), Validate, DailyTimeTableController.editTTelementPost);

dailytimetableRouter.post('/saveTTelement/:id', Verify, VerifyRole(), DailyTimeTableController.saveTTelement);

dailytimetableRouter.get('/newTTelement/:id', Verify, VerifyRole(), DailyTimeTableController.newTTelementGetById);

dailytimetableRouter.get('/newTTelement', Verify, VerifyRole(), DailyTimeTableController.newTTelementGet);

dailytimetableRouter.post('/newTTelement', Verify, VerifyRole(), Validate, DailyTimeTableController.newTTelementPost);
export default dailytimetableRouter;

