import express from 'express';

import {logger} from '../logger.js';
import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import EventController from '../controllers/eventController.js';

const eventRouter = express.Router();

eventRouter.get('/new', Verify, VerifyRole(), EventController.renderNew);

eventRouter.post('/new', Verify, VerifyRole(), EventController.createNew);
  eventRouter.get('/dashboard', Verify, VerifyRole(), EventController.dashboard);


eventRouter.get('/edit/:id', Verify, VerifyRole(), EventController.editGet);
eventRouter.post('/edit/:id', Verify, VerifyRole(), Validate, EventController.editPost);



eventRouter.get('/details/:id', Verify, VerifyRole(), EventController.details);
eventRouter.delete('/deleteResponsiblePerson/:id', Verify, VerifyRole(), EventController.deleteResponsiblePerson);
eventRouter.post('/addResponsiblePerson/:id', Verify, VerifyRole(), EventController.addResponsiblePerson);
    eventRouter.post('/selectEvent/:eventId', Verify, VerifyRole(), EventController.selectEvent);


export default eventRouter;