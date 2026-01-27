import express from 'express';
import { Verify, VerifyRole } from '../middleware/Verify.js';
import { uploadImage } from '../middleware/fileUpload.js';
import scoreSheetTemplateController from '../controllers/scoreSheetTemplateController.js';

const ScoreSheetTempRouter = express.Router();

ScoreSheetTempRouter.get('/dashboard', Verify, VerifyRole(), scoreSheetTemplateController.getScoreSheetTemplatesDashboard);

ScoreSheetTempRouter.get('/create', Verify, VerifyRole(), scoreSheetTemplateController.getCreateScoreSheetTemplateForm);

ScoreSheetTempRouter.post('/create', Verify, VerifyRole(), uploadImage.single('bgImageFile'), scoreSheetTemplateController.createNewScoreSheetTemplate);

ScoreSheetTempRouter.get('/edit/:id', Verify, VerifyRole(), scoreSheetTemplateController.getEditScoreSheetTemplateForm);

ScoreSheetTempRouter.post('/edit/:id', Verify, VerifyRole(), uploadImage.single('bgImageFile'), scoreSheetTemplateController.updateScoreSheetTemplateById);

ScoreSheetTempRouter.delete('/delete/:id', Verify, VerifyRole(), scoreSheetTemplateController.deleteScoreSheetTemplateById);

export default ScoreSheetTempRouter;