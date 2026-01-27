import express from 'express';

import { Verify, VerifyRole } from "../middleware/Verify.js";
import resultCalcTemplateController from '../controllers/resultCalcTemplateController.js';
import resultGeneratorController from '../controllers/resultGeneratorController.js';
import resultGroupController from '../controllers/resultGroupController.js';
import resultController from '../controllers/resultController.js';


const resultRouter = express.Router();

resultRouter.get("/calcTemp/dashboard", Verify, VerifyRole(), resultCalcTemplateController.getCalcTemplatesDashboard);
resultRouter.get("/calcTemp/new", Verify, VerifyRole(), resultCalcTemplateController.getNewCalcTemplateForm);
resultRouter.post("/calcTemp/new", Verify, VerifyRole(), resultCalcTemplateController.createNewCalcTemplate);
resultRouter.get("/calcTemp/edit/:id", Verify, VerifyRole(), resultCalcTemplateController.getEditCalcTemplateForm);

resultRouter.post("/calcTemp/edit/:id", Verify, VerifyRole(), resultCalcTemplateController.updateCalcTemplateById);


resultRouter.delete("/calcTemp/delete/:id", Verify, VerifyRole(), resultCalcTemplateController.deleteCalcTemplateById);


//Result Generator

resultRouter.get("/generator/dashboard", Verify, VerifyRole(), resultGeneratorController.getGeneratorsDashboard);

resultRouter.get("/generator/new", Verify, VerifyRole(), resultGeneratorController.getNewGeneratorForm);

resultRouter.post("/generator/new", Verify, VerifyRole(), resultGeneratorController.createNewGenerator);

resultRouter.post("/generator/status/:id", Verify, VerifyRole(), resultGeneratorController.updateGeneratorStatusById);


resultRouter.get("/generator/edit/:id", Verify, VerifyRole(), resultGeneratorController.getEditGeneratorForm);

resultRouter.post("/generator/edit/:id", Verify, VerifyRole(), resultGeneratorController.updateGeneratorById);

resultRouter.delete("/generator/delete/:id", Verify, VerifyRole(), resultGeneratorController.deleteGeneratorById);


// Result Groups

resultRouter.get("/groups/dashboard", Verify, VerifyRole(), resultGroupController.getResultGroupsDashboard);

resultRouter.get("/groups/edit/:id", Verify, VerifyRole(), resultGroupController.getEditResultGroupForm);

resultRouter.post("/groups/edit/:id", Verify, VerifyRole(), resultGroupController.updateResultGroupById);

resultRouter.get("/groups/new", Verify, VerifyRole(), resultGroupController.getNewResultGroupForm);

resultRouter.post("/groups/new", Verify, VerifyRole(), resultGroupController.createNewResultGroup);

resultRouter.delete("/groups/delete/:id", Verify, VerifyRole(), resultGroupController.deleteResultGroupById);

resultRouter.post("/groups/generate", Verify, VerifyRole(), resultGroupController.generateResultGroups);

resultRouter.get("/", Verify, VerifyRole(), resultController.getResultsDashboard);

resultRouter.get("/detailed/:id/:part", Verify, VerifyRole(), resultController.getDetailedResults);


export default resultRouter;
