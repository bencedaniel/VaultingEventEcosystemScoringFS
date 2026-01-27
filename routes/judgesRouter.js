import express from 'express';

import {logger} from '../logger.js';
import auth from '../controllers/auth.js';
import Validate from "../middleware/Validate.js";
import { check } from "express-validator";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import Permissions from '../models/Permissions.js';

const JudgesRouter = express.Router();

JudgesRouter.get('/', async (req, res) => {
    res.render('judges/judgeinput', {
        formData: req.session.formData,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null; // Clear the fail message after rendering
    req.session.successMessage = null; // Clear the success message after rendering 


});
JudgesRouter.post('/', async (req, res) => {
    console.log("Received judge input:", JSON.stringify(req.body, null, 2));
    // Here you can process the input data as needed
    req.session.successMessage = 'Judge input received successfully!';
    res.redirect('/judges');
});

export default JudgesRouter;