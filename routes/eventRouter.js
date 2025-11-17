import express from 'express';

import {logger} from '../logger.js';
import { Login } from "../controllers/auth.js";
import { Logout } from "../controllers/auth.js";
import Validate from "../middleware/Validate.js";
import { check } from "express-validator";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import Event from '../models/Event.js';
import Permissions from '../models/Permissions.js';
import User from '../models/User.js';

const eventRouter = express.Router();

eventRouter.get('/new',Verify, VerifyRole(), (req, res) => {
    res.render('event/newEvent', {
        formData: req.session.formData, 
        rolePermissons: req.user?.role?.permissions
        , failMessage: req.session.failMessage, successMessage: req.session.successMessage,
        user: req.user });
    req.session.failMessage = null; // Clear the fail message after rendering
    req.session.successMessage = null; // Clear the success message after rendering 
});

eventRouter.post('/new',Verify, VerifyRole(), async (req, res) => {
    try {
        const newEvent = new Event(req.body);
        await newEvent.save()
        logger.db(`Event ${newEvent.name} created by user ${req.user.username}.`);
        req.session.successMessage = 'Event created successfully!';
        res.redirect('/admin/event/dashboard');
    } catch (err) {
    logger.error(err + " User: "+ req.user.username);

    const errorMessage = err.errors
      ? Object.values(err.errors).map(e => e.message).join(' ')
      : 'Server error';

    return res.render('event/newEvent', {
        permissionList: await Permissions.find(),
      formData: req.body,
      successMessage: null,
      failMessage: errorMessage,
      card: { ...req.body, _id: req.params.id },
        user: req.user
    });
    
  }
});
  eventRouter.get('/dashboard',Verify, VerifyRole(), async (req, res) => {
        const events = await Event.find().sort({ name: 1 });
        logger.debug(req.session.successMessage)
        res.render('event/eventdash', {
            events,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
        user: req.user
        });
        req.session.failMessage = null; // Clear the fail message after rendering
        req.session.successMessage = null; // Clear the success message after rendering 
    });


    eventRouter.get('/edit/:id',Verify, VerifyRole(), async (req, res) => {
        try {
          const event = await Event.findById(req.params.id);
          if (!event) {
            req.session.failMessage = 'Event not found';
            return res.redirect('/admin/event/dashboard');
          }
          res.render('event/editEvent', {
            formData: event,
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
          return res.redirect('/admin/event/dashboard');
        }
      });
      eventRouter.post('/edit/:id',Verify, VerifyRole(), Validate, async (req, res) => {
        try {
          const event = await Event.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
          logger.db(`Event ${event.name} updated by user ${req.user.username}.`);
          if (!event) {
            req.session.failMessage = 'Event not found';
            return res.redirect('/admin/event/dashboard');
          }
          req.session.successMessage = 'Event updated successfully!';
          res.redirect('/admin/event/dashboard');
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
      
          const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
      
          return res.render('event/editEvent', {
            permissionList: await Permissions.find(),
            formData: { ...req.body, _id: req.params.id },
            successMessage: null,
            failMessage: errorMessage,
            user: req.user
          });
        }
      });



       eventRouter.get('/details/:id',Verify, VerifyRole(), async (req, res) => {
        try {
          const event = await Event.findById(req.params.id);
          const users = await User.find().select('_id username');
            if (!event) {
            req.session.failMessage = 'Event not found';
            return res.redirect('/event/dashboard');
          }
            res.render('event/EventDetail', {
              users: users,
                formData: event,
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
            return res.redirect('/event/dashboard');
        }
    });
          eventRouter.delete('/deleteResponsiblePerson/:id', Verify, VerifyRole(), async (req, res) => {
            try {
              const event = await Event.findById(req.params.id);
              logger.db(`Responsible person ${req.body.name} from event ${event.EventName} deleted by user ${req.user.username}.`);
              if (!event) {
                req.session.failMessage = 'Event not found';
                return res.status(404).json({ message: 'Event not found' });
              }
              


              event.AssignedOfficials = event.AssignedOfficials.filter(official =>
                !(
                  official.name === req.body.name &&
                  official.role === req.body.role &&
                  official.contact === req.body.contact
                )
              );
              await Event.findByIdAndUpdate(req.params.id, event, { runValidators: true });
              res.status(200).json({ message: `${req.body.name} responsible person deleted successfully by ${req.user.username}` });
            } catch (err) {
              logger.error(err + " User: "+ req.user.username);
              req.session.failMessage = 'Server error';
              res.status(500).json({ message: 'Server error' });
            }
          });
         eventRouter.post('/addResponsiblePerson/:id',Verify,VerifyRole(), async (req,res) =>{
          try{
            const event = await Event.findById(req.params.id);
            logger.db(`Responsible person added to event ${event.EventName} by user ${req.user.username}.`);
            const newResponsiblePerson= {
              name : req.body.name,
              role : req.body.role,
              contact: req.body.contact,
              userID : req.body.userID

            }
            event.AssignedOfficials.push(newResponsiblePerson);
            await Event.findByIdAndUpdate(req.params.id, event, { runValidators: true })
            res.status(200).json({ message: 'Responsible person added successfully!' })
          } catch (err) {
            logger.error(err + " User: "+ req.user.username);
            const errorMessage = err.errors
                ? Object.values(err.errors).map(e => e.message).join(' ')
                : 'Server error';
              req.session.failMessage = errorMessage;
            res.status(500).json({ message: errorMessage });
            }
            
    
        });
        eventRouter.post('/selectEvent/:eventId', Verify, VerifyRole(), async (req, res) => {
          try {
              const event = await Event.findById(req.params.eventId);
              if (!event) {
                  req.session.failMessage = 'Event not found';
                  return res.redirect('/admin/event/dashboard');
              }
              logger.db(`Event ${event.EventName} selected by user ${req.user.username}.`);
              await Event.setSelected(event._id); // eventId is the _id of the event to select
              req.session.selectedEvent = event._id;
              req.session.successMessage = 'Event selected successfully! ' + event.EventName;
              res.status(200).json({ message: 'Event selected successfully! ' + event.EventName });
          }
          catch (err) {
              logger.error(err + " User: "+ req.user.username);
              return res.status(500).json({ message: 'Server error' });
              ;
          }
      });


export default eventRouter;