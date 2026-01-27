import express from 'express';

import {logger} from '../logger.js';
import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import LungerController from '../controllers/lungerController.js';

const lungerRouter = express.Router();

lungerRouter.get('/new', Verify, VerifyRole(), LungerController.renderNew);

lungerRouter.post('/new', Verify, VerifyRole(), LungerController.createNew);

lungerRouter.get('/dashboard', Verify, VerifyRole(), LungerController.dashboard);


lungerRouter.get('/details/:id', Verify, VerifyRole(), LungerController.details);
lungerRouter.get('/edit/:id', Verify, VerifyRole(), LungerController.editGet);
lungerRouter.post('/edit/:id', Verify, VerifyRole(), Validate, LungerController.editPost);

     /* lungerRouter.delete('/delete/:id',Verify, VerifyRole(), async (req, res) => {
        try {

          const lunger = await Lunger.findByIdAndDelete(req.params.id);
          logger.db(`Lunger ${lunger.Name} deleted by user ${req.user.username}.`);
          if (!lunger) {
            req.session.failMessage = 'Lunger not found';
            return res.status(404).json({ message: 'Lunger not found' });
          }
          res.status(200).json({ message: 'Lunger deleted successfully' });
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });*/
lungerRouter.delete('/deleteIncident/:id', Verify, VerifyRole(), LungerController.deleteIncident);
lungerRouter.post('/newIncident/:id', Verify, VerifyRole(), LungerController.newIncidentPost);

export default lungerRouter;