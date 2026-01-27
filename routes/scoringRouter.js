import express from 'express';

import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import scoringJudgeController from '../controllers/scoringJudgeController.js';
import scoringOfficeController from '../controllers/scoringOfficeController.js';



const scoringRouter = express.Router();

scoringRouter.get('/', Verify, VerifyRole(), scoringJudgeController.getScoringDashboard);

scoringRouter.get('/program/:id', Verify, VerifyRole(), scoringJudgeController.getProgramDetails);

scoringRouter.get('/newscoresheet/:entryid/:tpid', Verify, VerifyRole(), scoringJudgeController.getNewScoresheetForm);

scoringRouter.post('/newscoresheet', Verify, VerifyRole(), Validate, scoringJudgeController.createNewScoresheet);



//OFFICE ROUTES

scoringRouter.get('/office/dashboard', Verify, VerifyRole(), scoringOfficeController.getOfficeDashboard);

scoringRouter.get('/office/scoresheet/edit/:id', Verify, VerifyRole(), scoringOfficeController.getEditScoresheetForm);

scoringRouter.post('/office/scoresheet/edit/:id', Verify, VerifyRole(), Validate, scoringOfficeController.updateScoresheetById);

scoringRouter.post('/office/scoresheet/edit1/:id', Verify, VerifyRole(), Validate, scoringOfficeController.updateScoresheetById);

scoringRouter.get('/office/scoresheet/new', Verify, VerifyRole(), scoringOfficeController.getNewScoresheetSelectionForm);

scoringRouter.post('/office/scoresheet/new', Verify, VerifyRole(), scoringOfficeController.handleNewScoresheetSelection);

scoringRouter.get('/office/newscoresheet/:entryid/:tpid', Verify, VerifyRole(), scoringOfficeController.getOfficeNewScoresheetForm);

scoringRouter.post('/office/newscoresheet', Verify, VerifyRole(), Validate, scoringOfficeController.createOfficeNewScoresheet);

scoringRouter.get('/office/scores', Verify, VerifyRole(), scoringOfficeController.getScoresList);

scoringRouter.post('/office/scores/recalculate/:id', Verify, VerifyRole(), scoringOfficeController.recalculateScoreById);

export default scoringRouter;
































