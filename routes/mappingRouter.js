import express from 'express';

import {logger} from '../logger.js';
import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import MappingController from '../controllers/mappingController.js';

const mappingRouter = express.Router();


mappingRouter.get('/new', Verify, VerifyRole(), MappingController.renderNew);
mappingRouter.post('/new', Verify, VerifyRole(), MappingController.createNew);
mappingRouter.get('/dashboard', Verify, VerifyRole(), MappingController.dashboard);


mappingRouter.get('/edit/:id', Verify, VerifyRole(), MappingController.editGet);
mappingRouter.post('/edit/:id', Verify, VerifyRole(), Validate, MappingController.editPost);
      
mappingRouter.delete('/delete/:id', Verify, VerifyRole(), MappingController.delete);

     
      







export default mappingRouter;