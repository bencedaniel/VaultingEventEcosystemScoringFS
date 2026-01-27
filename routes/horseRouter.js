import express from 'express';

import {logger} from '../logger.js';
import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import HorseController from '../controllers/horseController.js';


const HorseRouter = express.Router();

HorseRouter.get('/new', Verify, VerifyRole(), HorseController.renderNew);

HorseRouter.post('/new', Verify, VerifyRole(), Validate, HorseController.createNew);

HorseRouter.get('/dashboard', Verify, VerifyRole(), HorseController.dashboard);


HorseRouter.get('/details/:id', Verify, VerifyRole(), HorseController.details);
HorseRouter.get('/edit/:id', Verify, VerifyRole(), HorseController.editGet);
HorseRouter.post('/edit/:id', Verify, VerifyRole(), Validate, HorseController.editPost);

      /* HorseRouter.delete('/delete/:id',Verify, VerifyRole(), async (req, res) => {
        try {

          const horse = await Horse.findByIdAndDelete(req.params.id);
          logger.db(`Horse ${horse.name} deleted by user ${req.user.username}.`);
          if (!horse) {
            req.session.failMessage = 'Horse not found';
            return res.status(404).json({ message: 'Horse not found' });
          }
          res.status(200).json({ message: 'Horse deleted successfully' });
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });*/
HorseRouter.delete('/deleteNote/:id', Verify, VerifyRole(), HorseController.deleteNote);
HorseRouter.post('/newNote/:id', Verify, VerifyRole(), HorseController.newNotePost);



HorseRouter.get('/numbers', Verify, VerifyRole(), HorseController.numbersGet);
HorseRouter.post('/updatenums/:id', Verify, VerifyRole(), HorseController.updateNums);

export default HorseRouter;