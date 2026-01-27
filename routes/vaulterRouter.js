import express from 'express';

import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import vaulterController from '../controllers/vaulterController.js';
const vaulterRouter = express.Router();

vaulterRouter.get('/new', Verify, VerifyRole(), vaulterController.getNewVaulterForm);

vaulterRouter.post('/new', Verify, VerifyRole(), Validate, vaulterController.createNewVaulter);

vaulterRouter.get('/dashboard', Verify, VerifyRole(), vaulterController.getVaultersDashboard);

vaulterRouter.get('/details/:id', Verify, VerifyRole(), vaulterController.getVaulterDetails);

vaulterRouter.get('/edit/:id', Verify, VerifyRole(), vaulterController.getEditVaulterForm);

vaulterRouter.post('/edit/:id', Verify, VerifyRole(), Validate, vaulterController.updateVaulterById);

vaulterRouter.delete('/deleteIncident/:id', Verify, VerifyRole(), vaulterController.deleteVaulterIncident);

vaulterRouter.post('/newIncident/:id', Verify, VerifyRole(), vaulterController.createVaulterIncident);

vaulterRouter.get('/numbers', Verify, VerifyRole(), vaulterController.getArmNumbersEditPage);

vaulterRouter.post('/updatenums/:id', Verify, VerifyRole(), vaulterController.updateArmNumber);


export default vaulterRouter;