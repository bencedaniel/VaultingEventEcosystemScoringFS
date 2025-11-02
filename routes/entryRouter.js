import express from 'express';

import {dblogger, logger} from "../logger.js";
import { Login } from "../controllers/auth.js";
import { Logout } from "../controllers/auth.js";
import Validate from "../middleware/Validate.js";
import { check } from "express-validator";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import Entries from '../models/Entries.js';
import Permissions from '../models/Permissions.js';
import User from '../models/User.js';
import Vaulter from '../models/Vaulter.js';
import Lunger from '../models/Lunger.js';
import Horse from '../models/Horse.js';
import Category from '../models/Category.js';
import Event from '../models/Event.js';

const entryRouter = express.Router();

entryRouter.get('/new',Verify, VerifyRole(), async (req, res) => {
    res.render('entry/newEntry', {
        vaulters: await Vaulter.find(),
        lungers: await Lunger.find(),
        horses: await Horse.find(),
        categorys: await Category.find(),
        events: await Event.find(),
        formData: req.session.formData, 
        rolePermissons: req.user?.role?.permissions
        , failMessage: req.session.failMessage, successMessage: req.session.successMessage,
        user: req.user });
    req.session.failMessage = null; // Clear the fail message after rendering
    req.session.successMessage = null; // Clear the success message after rendering 
});

entryRouter.post('/new',Verify, VerifyRole(), async (req, res) => {
    try {
        console.log(req.body);
        const newEntry = new Entries(req.body);
        await newEntry.save()
        dblogger.db(`Entry ${newEntry.name} created by user ${req.user.username}.`);
        req.session.successMessage = 'Entry created successfully!';
        res.redirect('/entry/dashboard');
    } catch (err) {
    console.error(err);

    const errorMessage = err.errors
      ? Object.values(err.errors).map(e => e.message).join(' ')
      : 'Server error';

    return res.render('entry/newEntry', {
        permissionList: await Permissions.find(),
      formData: req.body,
      successMessage: null,
      failMessage: errorMessage,
      card: { ...req.body, _id: req.params.id },
        user: req.user
    });
    
  }
});
  entryRouter.get('/dashboard',Verify, VerifyRole(), async (req, res) => {
        const selectedEvent = await Event.findOne({ selected: true });
        
        const entrys = await Entries.find({ event: selectedEvent._id }).populate('vaulter').populate('horse').populate('lunger').populate('category').sort({ name: 1 });
        console.log(entrys);
        res.render('entry/entrydash', {
            entrys,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
        user: req.user
        });
        req.session.failMessage = null; // Clear the fail message after rendering
        req.session.successMessage = null; // Clear the success message after rendering 
    });


    entryRouter.get('/edit/:id',Verify, VerifyRole(), async (req, res) => {
        try {
          const entry = await Entries.findById(req.params.id).populate('vaulter').populate('horse').populate('lunger').populate('category').populate('event');
          if (!entry) {
            req.session.failMessage = 'Entry not found';
            return res.redirect('/entry/dashboard');
          }
          console.log(entry);
          res.render('entry/editEntry', {
        vaulters: await Vaulter.find(),
        lungers: await Lunger.find(),
        horses: await Horse.find(),
        categorys: await Category.find(),
        events: await Event.find(),
            formData: entry,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
        user: req.user
          });
          req.session.failMessage = null; // Clear the fail message after rendering
          req.session.successMessage = null; // Clear the success message after rendering
        } catch (err) {
          console.error(err);
          req.session.failMessage = 'Server error';
          return res.redirect('/entry/dashboard');
        }
      });
      entryRouter.post('/edit/:id', Verify, VerifyRole(), Validate, async (req, res) => {
        try {
          // Üres string helyett undefined/null, ha nincs kiválasztva

          const updateData = { ...req.body, _id: req.params.id };
          const entry = await Entries.findByIdAndDelete(req.params.id);
          if (!entry) {
            req.session.failMessage = 'Entry not found';
            return res.redirect('/entry/dashboard');
          }
          const updated = new Entries(updateData);
          
          await updated.save(); // await és try/catch-ben!
          dblogger.db(`Entry ${entry.EntryDispName} updated by user ${req.user.username}.`);
          req.session.successMessage = 'Entry updated successfully!';
          res.redirect('/entry/dashboard');
        } catch (err) {
          console.error(err);

          const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';

          return res.render('entry/editEntry', {
            permissionList: await Permissions.find(),
            formData: { ...req.body, _id: req.params.id },
            successMessage: null,
            failMessage: errorMessage,
            user: req.user
          });
        }
      });

      entryRouter.delete('/delete/:id',Verify, VerifyRole(), async (req, res) => {
        try {

          const entry = await Entries.findByIdAndDelete(req.params.id);
          dblogger.db(`Entry ${entry.name} deleted by user ${req.user.username}.`);
          if (!entry) {
            req.session.failMessage = 'Entry not found';
            return res.status(404).json({ message: 'Entry not found' });
          }
          res.status(200).json({ message: 'Entry deleted successfully' });
        } catch (err) {
          console.error(err);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });
      entryRouter.delete('/deleteIncident/:id', Verify, VerifyRole(), async (req, res) => {
        try {
          const entry = await Entries.findById(req.params.id);
          dblogger.db(`Entry ${entry.name} incident deleted by user ${req.user.username}.`);
          if (!entry) {
            req.session.failMessage = 'Entry not found';
            return res.status(404).json({ message: 'Entry not found' });
          }
          

          
          entry.EntryIncident = entry.EntryIncident.filter(incident =>
            !(
              incident.description === req.body.description &&
              incident.incidentType === req.body.type             )
          );
          await Entries.findByIdAndUpdate(req.params.id, entry, { runValidators: true });
          res.status(200).json({ message: 'Incident deleted successfully' });
        } catch (err) {
          console.error(err);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });
     entryRouter.post('/newIncident/:id',Verify,VerifyRole(), async (req,res) =>{
      try{
        const entry = await Entries.findById(req.params.id);
        dblogger.db(`Entry ${entry.Name} incident created by user ${req.user.username}.`);
        const newIncident = {
          description: req.body.description,
          incidentType: req.body.incidentType,
          date: Date.now(),
          User: req.user._id

        }    
        entry.EntryIncident.push(newIncident);
        await Entries.findByIdAndUpdate(req.params.id, entry, { runValidators: true })
        res.status(200).json({ message: 'Incident added successfully!' })
      } catch (err) {
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
          req.session.failMessage = errorMessage;
        res.status(500).json({ message: errorMessage });
        }
        

    });

    entryRouter.get('/vetCheck' ,Verify, VerifyRole(), async (req, res) => {
      const horsesontheEvent = await Entries.find({ event: res.locals.selectedEvent._id }).populate('horse').select('horse');


      const uniqueHorses = Array.from(new Set(horsesontheEvent.map(entry => entry.horse._id.toString())));
      const horses = await Horse.find({ _id: { $in: uniqueHorses } }).sort({ name: 1 });
      res.render('entry/vetcheckdash', {
          horses,
          rolePermissons: req.user?.role?.permissions,
          failMessage: req.session.failMessage,
          successMessage: req.session.successMessage,
      user: req.user
      });
      req.session.failMessage = null; // Clear the fail message after rendering
      req.session.successMessage = null; // Clear the success message after rendering 
  });





export default entryRouter;