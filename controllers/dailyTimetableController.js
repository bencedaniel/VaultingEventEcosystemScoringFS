import { logger } from '../logger.js';
import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import {
    getAllDailyTimeTables,
    getDailyTimeTableById,
    createDailyTimeTable,
    updateDailyTimeTable,
    deleteDailyTimeTable,
    getAllTimetableParts,
      getTimetablePartsByDailyTimeTable,
    getTimetablePartById,
    createTimetablePart,
    updateTimetablePart,
    deleteTimetablePart,
    saveTimetablePartStartTime,
    getTimetablePartFormData
} from '../services/dailyTimetableData.js';

// Temporary model imports kept for compatibility with existing templates
import DailyTimeTable from '../models/DailyTimeTable.js';
import TimetablePart from '../models/Timetablepart.js';

class DailyTimeTableController {
  renderNew = (req, res) => {
    res.render('dailytimetable/newdailytimetable', {
      formData: req.session.formData,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  }

  createNew = async (req, res) => {
    try {
      const newDailyTimeTable = await createDailyTimeTable(req.body);
      logger.db(`DailyTimeTable ${newDailyTimeTable.DayName} created by user ${req.user.username}.`);
      req.session.successMessage = 'DailyTimeTable created successfully!';
      res.redirect('/dailytimetable/dashboard');
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);

      const errorMessage = err.errors
          ? Object.values(err.errors).map(e => e.message).join(' ')
          : (err.message || 'Server error');

      return res.render('dailytimetable/newDailyTimeTable', {
          formData: req.body,
          successMessage: null,
          failMessage: errorMessage,
          rolePermissons: req.user?.role?.permissions,
          user: req.user
      });
    }
  }

  dashboard = async (req, res) => {
    try {
      const timetableparts = await getAllTimetableParts();
      const eventID = res.locals.selectedEvent?._id;
      const dailytimetables = await getAllDailyTimeTables(eventID);
      res.render('dailytimetable/dailytimetabledash', {
        timetableparts,
        dailytimetables,
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
      return res.redirect('/dashboard');
    }
  }

  details = async (req, res) => {
    try {
      const dailytimetable = await getDailyTimeTableById(req.params.id);
      if (!dailytimetable) {
        req.session.failMessage = 'DailyTimeTable not found';
        return res.redirect('/dailytimetable/dashboard');
      }
      res.render('dailytimetable/dailytimetableDetail', {
        formData: dailytimetable,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
      });
      req.session.failMessage = null;
      req.session.successMessage = null;
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);
      req.session.failMessage = err.message || 'Server error';
      return res.redirect('/dailytimetable/dashboard');
    }
  }

  editGet = async (req, res) => {
    try {
      const dailytimetable = await getDailyTimeTableById(req.params.id);
      if (!dailytimetable) {
        req.session.failMessage = 'DailyTimeTable not found';
        return res.redirect('/dailytimetable/dashboard');
      }

      res.render('dailytimetable/editdailytimetable', {
        formData: dailytimetable,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
      });
      req.session.failMessage = null;
      req.session.successMessage = null;
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);
      req.session.failMessage = err.message || 'Server error';
      return res.redirect('/dailytimetable/dashboard');
    }
  }

  editPost = async (req, res) => {
    try {
      const dailytimetable = await updateDailyTimeTable(req.params.id, req.body);
      if (!dailytimetable) {
        req.session.failMessage = 'DailyTimeTable not found';
        return res.redirect('/dailytimetable/dashboard');
      }
      logger.db(`DailyTimeTable ${dailytimetable.DayName} updated by user ${req.user.username}.`);
      req.session.successMessage = 'DailyTimeTable updated successfully!';
      res.redirect('/dailytimetable/dashboard');
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);

      const errorMessage = err.errors
          ? Object.values(err.errors).map(e => e.message).join(' ')
          : (err.message || 'Server error');

      return res.render('dailytimetable/editDailyTimeTable', {
          formData: { ...req.body, _id: req.params.id },
          successMessage: null,
          failMessage: errorMessage,
          rolePermissons: req.user?.role?.permissions,
          user: req.user
      });
    }
  }

  delete = async (req, res) => {
    try {
      const dailytimetable = await deleteDailyTimeTable(req.params.id);
      if (!dailytimetable) {
        return res.status(404).json({ message: 'DailyTimeTable not found' });
      }
      logger.db(`DailyTimeTable ${dailytimetable.DayName} and associated TimetableParts deleted by user ${req.user.username}.`);
      res.status(200).json({ message: 'DailyTimeTable deleted successfully' });
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);
      req.session.failMessage = err.message || 'Server error';
      res.status(500).json({ message: err.message || 'Server error' });
    }
  }

  dayparts = async (req, res) => {
    try {
      const dailytimetables = await getTimetablePartsByDailyTimeTable(req.params.id);
      const dailytable = await getDailyTimeTableById(req.params.id);
      if (!dailytimetables) {
        req.session.failMessage = 'DailyTimeTable not found';
        return res.redirect('/dailytimetable/dashboard');
      }
      res.render('dailytimetable/attacheddash', {
        dailytable: dailytable,
        formData: dailytimetables,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
      });
      req.session.failMessage = null;
      req.session.successMessage = null;
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);
      req.session.failMessage = err.message || 'Server error';
      return res.redirect('/dailytimetable/dashboard');
    }
  }

  deleteTTelement = async (req, res) => {
    try {
      const timetablepart = await deleteTimetablePart(req.params.id);
      if (!timetablepart) {
        return res.status(404).json({ message: 'TimetablePart not found' });
      }
      logger.db(`TimetablePart ${timetablepart.DayName} deleted by user ${req.user.username}.`);
      res.status(200).json({ message: 'Timetable element deleted successfully' });
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);
      req.session.failMessage = err.message || 'Server error';
      res.status(500).json({ message: err.message || 'Server error' });
    }
  }

  editTTelementGet = async (req, res) => {
    try {
      const { judges, days, categorys } = await getTimetablePartFormData(res.locals.selectedEvent._id);
      const timetablepart = await getTimetablePartById(req.params.id);

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
      req.session.failMessage = err.message || 'Server error';
      return res.redirect('/dailytimetable/dashboard');
    }
  }

  editTTelementPost = async (req, res) => {
    try {
      const timetablepart = await updateTimetablePart(req.params.id, req.body);
      logger.db(`Timetable element ${timetablepart.Name} updated by user ${req.user.username}.`);

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
      
      const { judges, days, categorys } = await getTimetablePartFormData(res.locals.selectedEvent._id);
      return res.render('dailytimetable/editttelement', {
        judges,
        days,
        categorys,
        formData: { ...req.body, _id: req.params.id },
        rolePermissons: req.user?.role?.permissions,
        successMessage: null,
        failMessage: errorMessage,
        user: req.user
      });
    }
  }

  saveTTelement = async (req, res) => {
    try {
      const timetablepart = await saveTimetablePartStartTime(req.params.id);
      logger.db(`Timetable element ${timetablepart.Name} start time saved by user ${req.user.username}.`);
      res.status(200).json({ message: 'Timetable element start time saved successfully' });
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);
      req.session.failMessage = err.message || 'Server error';
      res.status(500).json({ message: err.message || 'Server error' });
    }
  }

  newTTelementGetById = async (req, res) => {
    try {
      const { judges, days, categorys } = await getTimetablePartFormData(res.locals.selectedEvent._id);
      const dailytable = await getDailyTimeTableById(req.params.id);

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
      req.session.failMessage = err.message || 'Server error';
      return res.redirect('/dailytimetable/dashboard');
    }
  }

  newTTelementGet = async (req, res) => {
    try {
      const { judges, days, categorys } = await getTimetablePartFormData(res.locals.selectedEvent._id);

      res.render('dailytimetable/newttelement', {
        judges,
        days,
        categorys,
        formData: null,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
      }); 
      req.session.failMessage = null;
      req.session.successMessage = null;
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);
      req.session.failMessage = err.message || 'Server error';
      return res.redirect('/dailytimetable/dashboard');
    }
  }

  newTTelementPost = async (req, res) => {
    try {
      const newTimetablePart = await createTimetablePart(req.body);
      logger.db(`TimetablePart ${newTimetablePart.Name} created by user ${req.user.username}.`);
      req.session.successMessage = 'Timetable element created successfully!';
      res.redirect('/dailytimetable/dayparts/' + newTimetablePart.dailytimetable);
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);
  
      const errorMessage = err.errors
        ? Object.values(err.errors).map(e => e.message).join(' ')
        : (err.message || 'Server error');
      
      const { judges, days, categorys } = await getTimetablePartFormData(res.locals.selectedEvent._id);
      return res.render('dailytimetable/newttelement', {
        judges,
        days,
        categorys,
        formData: req.body,
        successMessage: null,
        failMessage: errorMessage,
        user: req.user
      });
    }
  }
}

export default new DailyTimeTableController();
