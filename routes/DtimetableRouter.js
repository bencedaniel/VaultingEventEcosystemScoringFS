import express from 'express';

import {logger} from '../logger.js';
import { Login } from "../controllers/auth.js";
import { Logout } from "../controllers/auth.js";
import Validate from "../middleware/Validate.js";
import { check } from "express-validator";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import DailyTimeTable from '../models/DailyTimeTable.js';
import Permissions from '../models/Permissions.js';
import User from '../models/User.js';
import TimetablePart from '../models/Timetablepart.js';
import Category from '../models/Category.js';
import Event from '../models/Event.js';

const dailytimetableRouter = express.Router();

dailytimetableRouter.get('/new',Verify, VerifyRole(), (req, res) => {
    res.render('dailytimetable/newDailyTimeTable', {
        formData: req.session.formData, 
        rolePermissons: req.user?.role?.permissions
        , failMessage: req.session.failMessage, successMessage: req.session.successMessage,
        user: req.user });
    req.session.failMessage = null; // Clear the fail message after rendering
    req.session.successMessage = null; // Clear the success message after rendering 
});

dailytimetableRouter.post('/new',Verify, VerifyRole(), Validate, async (req, res) => {
    try {
        const newDailyTimeTable = new DailyTimeTable(req.body);
        await newDailyTimeTable.save()
        logger.db(`DailyTimeTable ${newDailyTimeTable.DayName} created by user ${req.user.username}.`);
        req.session.successMessage = 'DailyTimeTable created successfully!';
        res.redirect('/dailytimetable/dashboard');
    } catch (err) {
    logger.error(err + " User: "+ req.user.username);

    const errorMessage = err.errors
      ? Object.values(err.errors).map(e => e.message).join(' ')
      : (err.message || 'Server error');

    return res.render('dailytimetable/newDailyTimeTable', {
        permissionList: await Permissions.find(),
      formData: req.body,
      successMessage: null,
      failMessage: errorMessage,
      card: { ...req.body, _id: req.params.id },
        user: req.user
    });
    
  }
});
  dailytimetableRouter.get('/dashboard',Verify, VerifyRole(), async (req, res) => {
        const timetableparts = await TimetablePart.find();
        const eventID = res.locals.selectedEvent?._id;
        const dailytimetables = await DailyTimeTable.find({ event: eventID }).sort({ Date: 1 });
        res.render('dailytimetable/dailytimetabledash', {
            timetableparts,
            dailytimetables,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
        user: req.user
        });
        req.session.failMessage = null; // Clear the fail message after rendering
        req.session.successMessage = null; // Clear the success message after rendering 
    });


    dailytimetableRouter.get('/details/:id',Verify, VerifyRole(), async (req, res) => {
        try {
            const dailytimetable = await DailyTimeTable.findById(req.params.id);
            if (!dailytimetable) {
            req.session.failMessage = 'DailyTimeTable not found';
            return res.redirect('/dailytimetable/dashboard');
          }
            res.render('dailytimetable/dailytimetableDetail', {
                users: await User.find(),
                formData: dailytimetable,
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
            return res.redirect('/dailytimetable/dashboard');
        }
    });
    dailytimetableRouter.get('/edit/:id',Verify, VerifyRole(), async (req, res) => {
        try {
          const dailytimetable = await DailyTimeTable.findById(req.params.id);
          if (!dailytimetable) {
            req.session.failMessage = 'DailyTimeTable not found';
            return res.redirect('/dailytimetable/dashboard');
          }

          res.render('dailytimetable/editDailyTimeTable', {
            formData: dailytimetable,
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
          return res.redirect('/dailytimetable/dashboard');
        }
      });
      dailytimetableRouter.post('/edit/:id',Verify, VerifyRole(), Validate, async (req, res) => {
        try {
          const dailytimetable = await DailyTimeTable.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
          logger.db(`DailyTimeTable ${dailytimetable.DayName} updated by user ${req.user.username}.`);
          if (!dailytimetable) {
            req.session.failMessage = 'DailyTimeTable not found';
            return res.redirect('/dailytimetable/dashboard');
          }
          req.session.successMessage = 'DailyTimeTable updated successfully!';
          res.redirect('/dailytimetable/dashboard'
          );
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
      
          const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : (err.message || 'Server error');
      
          return res.render('dailytimetable/editDailyTimeTable', {
            permissionList: await Permissions.find(),
            formData: { ...req.body, _id: req.params.id },
            successMessage: null,
            failMessage: errorMessage,
            user: req.user
          });
        }
      });

      dailytimetableRouter.delete('/delete/:id',Verify, VerifyRole(), async (req, res) => {
        try {

          const dailytimetable = await DailyTimeTable.findByIdAndDelete(req.params.id);
          logger.db(`DailyTimeTable ${dailytimetable.DayName} deleted by user ${req.user.username}.`);
          if (!dailytimetable) {
            req.session.failMessage = 'DailyTimeTable not found';
            return res.status(404).json({ message: 'DailyTimeTable not found' });
          }
          res.status(200).json({ message: 'DailyTimeTable deleted successfully' });
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });
      
      dailytimetableRouter.get('/dayparts/:id',Verify, VerifyRole(), async (req, res) => {
        try {

            const dailytimetables = await TimetablePart.find({dailytimetable: req.params.id}).sort({ StartTimePlanned: 1 });
            const dailytable = await DailyTimeTable.findById(req.params.id);
            if (!dailytimetables) {
            req.session.failMessage = 'DailyTimeTable not found';
            return res.redirect('/dailytimetable/dashboard');
          }
            res.render('dailytimetable/attacheddash', {
              dailytable: dailytable,
                users: await User.find(),
                formData: dailytimetables,
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
            return res.redirect('/dailytimetable/dashboard');
        }
    });
          dailytimetableRouter.delete('/deleteTTelement/:id',Verify, VerifyRole(), async (req, res) => {
        try {

          const timetablepart = await TimetablePart.findByIdAndDelete(req.params.id);
          logger.db(`TimetablePart ${timetablepart.DayName} deleted by user ${req.user.username}.`);
          if (!timetablepart) {
            req.session.failMessage = 'TimetablePart not found';
            return res.status(404).json({ message: 'TimetablePart not found' });
          }
          res.status(200).json({ message: 'Timetable element deleted successfully' });
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });

          dailytimetableRouter.get('/editTTelement/:id',Verify, VerifyRole(), async (req, res) => {
        try {

          const OnsiteOfficials = await Event.findOne({selected: true}).select('AssignedOfficials');
          
          if (!OnsiteOfficials?.AssignedOfficials) {
            req.session.failMessage = 'No onsite officials found';
            return res.redirect('/dailytimetable/dashboard');
          }

          // 1. Megoldás: Promise.all (párhuzamos lekérés, gyors)
          const userPromises = OnsiteOfficials.AssignedOfficials
            .filter(official => official.userID)
            .map(official => User.findById(official.userID).populate('role').select('-password'));
          
          const users = (await Promise.all(userPromises)).filter(Boolean); // null-ok kiszűrése


          const judges = users.filter(u => u.role?.roleName.includes('Judge'));
          const days = await DailyTimeTable.find({event: res.locals.selectedEvent._id}).sort({Date: 1});
          const categorys = await Category.find();
          const timetablepart = await TimetablePart.findById(req.params.id).populate('dailytimetable');

          if (!timetablepart) {
            req.session.failMessage = 'Timetable element not found';
            return res.redirect('/dailytimetable/dashboard');
          }

          res.render('dailytimetable/editttelement', {
            judges,
            days,
            categorys,
            formData: timetablepart,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
          });
          req.session.failMessage = null;
          req.session.successMessage = null;
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = 'Server error';
          return res.redirect('/dailytimetable/dashboard');
        }
      });

     dailytimetableRouter.post('/editTTelement/:id',Verify, VerifyRole(), Validate, async (req, res) => {
        try {
          console.log('Received form data:', req.body);
          const timetablepart = await TimetablePart.findByIdAndUpdate(
            req.params.id,
            req.body,
            { runValidators: true, new: true }
          );

          if (!timetablepart) {
            req.session.failMessage = 'Timetable element not found';
            return res.redirect('/dailytimetable/dashboard');
          }

          logger.db(`Timetable element ${timetablepart.Name} updated by user ${req.user.username}.`);

          // Biztonságos redirect: req.body-ból vagy frissített doksból
          const dayId = req.body.dailytimetable || timetablepart.dailytimetable?.toString();
          if (!dayId) {
            req.session.failMessage = 'Parent day missing';
            return res.redirect('/dailytimetable/dashboard');
          }

          req.session.successMessage = 'Timetable element updated successfully!';
          return res.redirect('/dailytimetable/dayparts/' + dayId);
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);

          const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : (err.message || 'Server error');

          return res.render('dailytimetable/editttelement', {
            
            days: await DailyTimeTable.find({event: res.locals.selectedEvent._id}).sort({Date: 1}),
            categorys: await Category.find(),
            formData: { ...req.body, _id: req.params.id },
            rolePermissons: req.user?.role?.permissions,
            successMessage: null,
            failMessage: errorMessage,
            user: req.user
          });
        }
      });
      dailytimetableRouter.post('/saveTTelement/:id',Verify, VerifyRole(), async (req, res) => {
        try {
          
          const timetablepart = await TimetablePart.findById(req.params.id);
          if (!timetablepart) {
            req.session.failMessage = 'Timetable element not found';
            return res.status(404).json({ message: 'Timetable element not found' });
          }

          // Mentés logikája (pl. aktuális idő mentése)
          timetablepart.StartTimeReal = new Date();
          await timetablepart.save();

          logger.db(`Timetable element ${timetablepart.Name} start time saved by user ${req.user.username}.`);

          res.status(200).json({ message: 'Timetable element start time saved successfully' });
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });
      dailytimetableRouter.get('/newTTelement/:id',Verify, VerifyRole(), async (req, res) => {
        try {
          const OnsiteOfficials = await Event.findOne({selected: true}).select('AssignedOfficials');
          
          if (!OnsiteOfficials?.AssignedOfficials) {
            req.session.failMessage = 'No onsite officials found';
            return res.redirect('/dailytimetable/dashboard');
          }

          // 1. Megoldás: Promise.all (párhuzamos lekérés, gyors)
          const userPromises = OnsiteOfficials.AssignedOfficials
            .filter(official => official.userID)
            .map(official => User.findById(official.userID).populate('role').select('-password'));
          
          const users = (await Promise.all(userPromises)).filter(Boolean); // null-ok kiszűrése


          const judges = users.filter(u => u.role?.roleName.includes('Judge'));
          const days = await DailyTimeTable.find({event: res.locals.selectedEvent._id}).sort({Date: 1});
          const categorys = await Category.find();
          const dailytable = await DailyTimeTable.findById(req.params.id);
          const formData = { dailytimetable: dailytable._id };
          if (!dailytable) {
            req.session.failMessage = 'Daily timetable not found';
            return res.redirect('/dailytimetable/dashboard');
          }

          res.render('dailytimetable/newttelement', {
            judges,
            days,
            categorys,
            dailytable,
            formData: { dailytimetable: dailytable._id },
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
          }); 
          req.session.failMessage = null;
          req.session.successMessage = null;
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = 'Server error';
          return res.redirect('/dailytimetable/dashboard');
        }
      });

            dailytimetableRouter.get('/newTTelement',Verify, VerifyRole(), async (req, res) => {
  try {
    const OnsiteOfficials = await Event.findOne({selected: true}).select('AssignedOfficials');
    
    if (!OnsiteOfficials?.AssignedOfficials) {
      req.session.failMessage = 'No onsite officials found';
      return res.redirect('/dailytimetable/dashboard');
    }

    // 1. Megoldás: Promise.all (párhuzamos lekérés, gyors)
    const userPromises = OnsiteOfficials.AssignedOfficials
      .filter(official => official.userID)
      .map(official => User.findById(official.userID).populate('role').select('-password'));
    
    const users = (await Promise.all(userPromises)).filter(Boolean); // null-ok kiszűrése




    const judges = users.filter(u => u.role?.roleName.includes('Judge'));
    const days = await DailyTimeTable.find({event: res.locals.selectedEvent._id}).sort({Date: 1});
    const categorys = await Category.find();

    res.render('dailytimetable/newttelement', {
      judges,
      days,
      categorys,
      formData: null, // Új elem hozzáadása, nincs dailytimetable még
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    }); 
    req.session.failMessage = null;
    req.session.successMessage = null;
  } catch (err) {
    logger.error(err + " User: "+ req.user.username);
    req.session.failMessage = 'Server error';
    return res.redirect('/dailytimetable/dashboard');
  }
});
export default dailytimetableRouter;

