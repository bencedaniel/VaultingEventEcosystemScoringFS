import express from 'express';

import {logger} from '../logger.js';
import { Login } from "../controllers/auth.js";
import { Logout } from "../controllers/auth.js";
import Validate from "../middleware/Validate.js";
import { check } from "express-validator";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import Alert from '../models/Alert.js';
import Permissions from '../models/Permissions.js';
import User from '../models/User.js';

const alertRouter = express.Router();

alertRouter.get('/new',Verify, VerifyRole(), async (req, res) => {
    res.render('alert/newAlert', {
        permissionList: await Permissions.find(),
        formData: req.session.formData, 
        rolePermissons: req.user?.role?.permissions
        , failMessage: req.session.failMessage, successMessage: req.session.successMessage,
        user: req.user });
    req.session.failMessage = null; // Clear the fail message after rendering
    req.session.successMessage = null; // Clear the success message after rendering 
});

alertRouter.post('/new',Verify, VerifyRole(), async (req, res) => {
    try {
        
        const newAlert = new Alert(req.body);
        await newAlert.save()
        logger.db(`Alert ${newAlert._id} created by user ${req.user.username}.`);
        req.session.successMessage = 'Alert created successfully!';
        res.redirect('/alerts/dashboard');
    } catch (err) {
    logger.error(err + " User: "+ req.user.username);

    const errorMessage = err.errors
      ? Object.values(err.errors).map(e => e.message).join(' ')
      : 'Server error';

    return res.render('alert/newAlert', {
        permissionList: await Permissions.find(),
      formData: req.body,
      successMessage: null,
      failMessage: errorMessage,
      card: { ...req.body, _id: req.params.id },
        user: req.user
    });
    
  }
});
  alertRouter.get('/dashboard',Verify, VerifyRole(), async (req, res) => {
        const alerts = await Alert.find().sort({ name: 1 });
        res.render('alert/alertdash', {
            alerts,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
        user: req.user
        });
        req.session.failMessage = null; // Clear the fail message after rendering
        req.session.successMessage = null; // Clear the success message after rendering 
    });


    alertRouter.get('/edit/:id',Verify, VerifyRole(), async (req, res) => {
        try {
          const alert = await Alert.findById(req.params.id);
          if (!alert) {
            req.session.failMessage = 'Alert not found';
            return res.redirect('/alerts/dashboard');
          }
          res.render('alert/editAlert', {
            permissionList: await Permissions.find(),
            formData: alert,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,

            successMessage: req.session.successMessage,
        user: req.user
          });
          req.session.failMessage = null; // Clear the fail message after rendering
          req.session.successMessage = null; // Clear the success message after rendering
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = 'Server error';
          return res.redirect('/alerts/dashboard');
        }
      });

      alertRouter.post('/edit/:id',Verify, VerifyRole(), Validate, async (req, res) => {
        try {
          const alert = await Alert.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
          logger.db(`Alert ${alert._id} updated by user ${req.user.username}.`);
          if (!alert) {
            req.session.failMessage = 'Alert not found';
            return res.redirect('/alerts/dashboard');
          }
          req.session.successMessage = 'Alert updated successfully!';
          res.redirect('/alerts/dashboard');


        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
      
          const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
      
          return res.render('alert/editAlert', {
            permissionList: await Permissions.find(),
            formData: { ...req.body, _id: req.params.id },
            successMessage: null,
            failMessage: errorMessage,
            user: req.user
          });
        }
      });
      
       alertRouter.delete('/delete/:id',Verify, VerifyRole(), async (req, res) => {
        try {

          const alert = await Alert.findByIdAndDelete(req.params.id);
          logger.db(`Alert ${alert._id} deleted by user ${req.user.username}.`);
          if (!alert) {
            req.session.failMessage = 'Alert not found';
            return res.status(404).json({ message: 'Alert not found' });
          }
          res.status(200).json({ message: 'Alert deleted successfully' });
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });

      alertRouter.get('/checkEvent/',Verify,VerifyRole(), async (req,res) => {
         const eventID = res.locals.selectedEvent?._id;
        if(!eventID){
            return res.status(400).json({ message: 'No event selected' });
        }
        const newAlert = {
            description: `Incomplete`,
            title: 'Needed to define why needed this alert (Nincsenek jelenleg definialva milyen részeket ellenőrizzen a rendszer itt)',
            permission: 'admin_dashboard',
            active: true,
            reappear: 100,
            style: 'info'
        }
            const alert = new Alert(newAlert);
            await alert.save();
            logger.db(`Alert ${alert._id} created by syste.`);
            res.session.successMessage = 'Alerts created successfully!';
            res.redirect('/alerts/dashboard');
        

        

      });

      







export default alertRouter;