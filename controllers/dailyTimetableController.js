import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
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
} from '../DataServices/dailyTimetableData.js';

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

  createNew = asyncHandler(async (req, res) => {
      const newDailyTimeTable = await createDailyTimeTable(req.body);
      logOperation('DAILY_TIMETABLE_CREATE', `Daily TimeTable created: ${newDailyTimeTable.DayName}`, req.user.username, HTTP_STATUS.CREATED);
      req.session.successMessage = MESSAGES.SUCCESS.DAILY_TIMETABLE_CREATED;
      res.redirect('/dailytimetable/dashboard');

    
  })

  dashboard = asyncHandler(async (req, res) => {
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
  })

  details = asyncHandler(async (req, res) => {
    const dailytimetable = await getDailyTimeTableById(req.params.id);
    if (!dailytimetable) {
      req.session.failMessage = MESSAGES.ERROR.DAILY_TIMETABLE_NOT_FOUND;
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
  })

  editGet = asyncHandler(async (req, res) => {
    const dailytimetable = await getDailyTimeTableById(req.params.id);
    if (!dailytimetable) {
      req.session.failMessage = MESSAGES.ERROR.DAILY_TIMETABLE_NOT_FOUND;
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
  })

  editPost = asyncHandler(async (req, res) => {
      const dailytimetable = await updateDailyTimeTable(req.params.id, req.body);
      if (!dailytimetable) {
        req.session.failMessage = MESSAGES.ERROR.DAILY_TIMETABLE_NOT_FOUND;
        return res.redirect('/dailytimetable/dashboard');
      }
      logOperation('DAILY_TIMETABLE_UPDATE', `Daily TimeTable updated: ${dailytimetable.DayName}`, req.user.username, HTTP_STATUS.OK);
      req.session.successMessage = MESSAGES.SUCCESS.DAILY_TIMETABLE_UPDATED;
      res.redirect('/dailytimetable/dashboard');
   
    
  })

  delete = asyncHandler(async (req, res) => {
    const dailytimetable = await deleteDailyTimeTable(req.params.id);
    if (!dailytimetable) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: MESSAGES.ERROR.DAILY_TIMETABLE_NOT_FOUND });
    }
    logOperation('DAILY_TIMETABLE_DELETE', `Daily TimeTable deleted: ${dailytimetable.DayName}`, req.user.username, HTTP_STATUS.OK);
    res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.DAILY_TIMETABLE_DELETED });
  })

  dayparts = asyncHandler(async (req, res) => {
    const dailytimetables = await getTimetablePartsByDailyTimeTable(req.params.id);
    const dailytable = await getDailyTimeTableById(req.params.id);
    if (!dailytimetables) {
      req.session.failMessage = MESSAGES.ERROR.DAILY_TIMETABLE_NOT_FOUND;
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
  })

  deleteTTelement = asyncHandler(async (req, res) => {
    const timetablepart = await deleteTimetablePart(req.params.id);
    if (!timetablepart) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: MESSAGES.ERROR.TIMETABLE_ELEMENT_NOT_FOUND });
    }
    logOperation('TIMETABLE_PART_DELETE', `Timetable Part deleted: ${timetablepart.DayName}`, req.user.username, HTTP_STATUS.OK);
    res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.TIMETABLE_ELEMENT_DELETED });
  })

  editTTelementGet = asyncHandler(async (req, res) => {
    const { judges, days, categorys } = await getTimetablePartFormData(res.locals.selectedEvent._id);
    const timetablepart = await getTimetablePartById(req.params.id);

    if (!timetablepart) {
      req.session.failMessage = MESSAGES.ERROR.TIMETABLE_ELEMENT_NOT_FOUND;
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
  })

  editTTelementPost = asyncHandler(async (req, res) => {
      const timetablepart = await updateTimetablePart(req.params.id, req.body);
      logOperation('TIMETABLE_PART_UPDATE', `Timetable Part updated: ${timetablepart.Name}`, req.user.username, HTTP_STATUS.OK);

      const dayId = req.body.dailytimetable || timetablepart.dailytimetable?.toString();
      if (!dayId) {
        req.session.failMessage = MESSAGES.ERROR.PARENT_DAY_MISSING;
        return res.redirect('/dailytimetable/dashboard');
      }

      req.session.successMessage = MESSAGES.SUCCESS.TIMETABLE_ELEMENT_UPDATED;
      return res.redirect('/dailytimetable/dayparts/' + dayId);

  })

  saveTTelement = asyncHandler(async (req, res) => {
    const timetablepart = await saveTimetablePartStartTime(req.params.id);
    logOperation('TIMETABLE_PART_UPDATE', `Timetable Part updated: ${timetablepart.Name}`, req.user.username, HTTP_STATUS.OK);
    res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.TIMETABLE_ELEMENT_UPDATED });
  })

  newTTelementGetById = asyncHandler(async (req, res) => {
    const { judges, days, categorys } = await getTimetablePartFormData(res.locals.selectedEvent._id);
    const dailytable = await getDailyTimeTableById(req.params.id);

    if (!dailytable) {
      req.session.failMessage = MESSAGES.ERROR.DAILY_TIMETABLE_NOT_FOUND;
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
  })

  newTTelementGet = asyncHandler(async (req, res) => {
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
  })

  newTTelementPost = asyncHandler(async (req, res) => {
      const newTimetablePart = await createTimetablePart(req.body);
      logOperation('TIMETABLE_PART_CREATE', `Timetable Part created: ${newTimetablePart.Name}`, req.user.username, HTTP_STATUS.CREATED);
      req.session.successMessage = MESSAGES.SUCCESS.TIMETABLE_ELEMENT_CREATED;
      res.redirect('/dailytimetable/dayparts/' + newTimetablePart.dailytimetable);

  })
}

export default new DailyTimeTableController();
