import express from 'express';

import {logger} from '../logger.js';
import { Verify, VerifyRole } from "../middleware/Verify.js";
import OrderController from '../controllers/orderController.js';

const orderRouter = express.Router();

orderRouter.get('/edit/:id', Verify, VerifyRole(), OrderController.editGet);

orderRouter.post('/overwrite/:id', Verify, VerifyRole(), OrderController.overwrite);

orderRouter.get('/createOrder/:id', Verify, VerifyRole(), OrderController.createOrder);

orderRouter.get('/confirmConflicts/:id', Verify, VerifyRole(), OrderController.confirmConflicts);

orderRouter.post('/getNewOrder/:id', Verify, VerifyRole(), OrderController.getNewOrder);

orderRouter.get('/createSelect/:id', Verify, VerifyRole(), OrderController.createSelectGet);

orderRouter.post('/createSelect/:id', Verify, VerifyRole(), OrderController.createSelectPost);

export default orderRouter;