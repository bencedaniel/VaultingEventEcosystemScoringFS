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
import Entries from '../models/Entries.js'; // vagy a te modell fájlneved
import { log } from 'console';
import { watch } from 'fs/promises';
import ScoreSheetTemp from '../models/ScoreSheetTemp.js';
import TableMapping from '../models/TableMapping.js';



const scoringRouter = express.Router();

scoringRouter.get('/', Verify, VerifyRole(), async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
    const day = await DailyTimeTable.findOne({ Date: { $gte: start, $lt: end } })
    if (!day) {
      req.session.failMessage = 'No timetable for today';
      return  res.redirect('/dashboard');
    }else {
    
    const timetableParts = await TimetablePart.find({dailytimetable : day._id}).populate('Category').exec();

    res.render('scoringJudge/dashboard', {
      timetableParts: timetableParts,
      day: day,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;}

  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    req.session.failMessage = 'Server error';
    return res.redirect('/admin/dashboard');
  }
});

scoringRouter.get('/program/:id', Verify, VerifyRole(), async (req, res) => {
  try {
    const timetablePart = await TimetablePart.findById(req.params.id)
      .populate('Category')
      .populate({
        path: 'StartingOrder.Entry',
        populate: [
          { path: 'vaulter' },
          { path: 'category' },
          { path: 'lunger' },
          { path: 'horse' }
        ]
      })
      .exec();
    if(timetablePart.drawingDone === false){
      req.session.failMessage = 'Drawing not done yet for this timetable part';
      return res.redirect('/scoring');
    }
    if(timetablePart.conflictsChecked === false){
      req.session.failMessage = 'Conflicts not checked yet for this timetable part';
      return res.redirect('/scoring');
    }
    if (!timetablePart) {
      req.session.failMessage = 'Timetable part not found';
      return res.redirect('/scoring');
    }
    let JudgeName = "";
    let tablebyJudge = "";
    timetablePart.JudgesList = timetablePart.JudgesList.filter(j => j.JudgeUserID.toString() === req.user._id.toString());
    if (timetablePart.JudgesList.length === 0) {
       JudgeName = "Not authorized judge"; 
    }
    else {
      const JudgeUser = await User.findById(timetablePart.JudgesList[0].JudgeUserID).exec();
       JudgeName = JudgeUser.fullname;
      tablebyJudge = timetablePart.JudgesList[0].Table;

    }
    


    const entries = await Entries.find({ event : res.locals.selectedEvent._id })
    .populate('vaulter')
    .populate('category')
    .populate('lunger')
    .populate('horse').exec();

    res.render('scoringJudge/perprogram', {
      tablebyJudge: tablebyJudge,
      judgeName: JudgeName,
      timetablePart: timetablePart,
      entries: entries,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;

  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    req.session.failMessage = 'Server error';
    return res.redirect('/scoring');
  }
});

scoringRouter.get('/newscoresheet/:entryid/:tpid', Verify, VerifyRole(), async (req, res) => {
  try {
        const timetablePart = await TimetablePart.findById(req.params.tpid).populate('dailytimetable').exec();

    let JudgeName = "";
    let tablebyJudge = "";
    timetablePart.JudgesList = timetablePart.JudgesList.filter(j => j.JudgeUserID.toString() === req.user._id.toString());
    if (timetablePart.JudgesList.length === 0) {
       JudgeName = "Not authorized judge"; 
       req.session.failMessage = 'You are not assigned as a judge for this timetable part';
       return res.redirect('/scoring');
    }
    else {
      const JudgeUser = await User.findById(timetablePart.JudgesList[0].JudgeUserID).exec();
       JudgeName = JudgeUser.fullname;
      tablebyJudge = timetablePart.JudgesList[0].Table;

    }

    const RoleOfTable = await TableMapping.findOne({ Table: tablebyJudge,TestType: timetablePart.TestType.toLocaleLowerCase() }).exec();
    if (!RoleOfTable) {
      logger.warn(`No RoleOfTable found for Table: ${tablebyJudge}, TestType: ${timetablePart.TestType.toLocaleLowerCase()}. User: ${req.user.username}`);
      req.session.failMessage = 'No role mapping found for your judge table in this timetable part';
      return res.redirect('/scoring');
    }


    const entry = await Entries.findById(req.params.entryid)
    .populate('vaulter')
    .populate('category')
    .populate('lunger')
    .populate('horse').exec();
    if (!entry) {
      req.session.failMessage = 'Entry not found';
      return res.redirect('/scoring');
    }
    if (!timetablePart) {
      req.session.failMessage = 'Timetable part not found';
      return res.redirect('/scoring');
    }



    const scoresheetTemp = await ScoreSheetTemp.findOne({
      TestType: { $regex: new RegExp(`^${timetablePart.TestType}$`, 'i') },
      CategoryId: entry.category._id,
      numberOfJudges: timetablePart.NumberOfJudges,
      typeOfScores: RoleOfTable.Role,


    }).exec();



    
    if (!scoresheetTemp) {
      req.session.failMessage = 'No score sheet template found for this configuration';
      logger.warn(`No ScoreSheetTemp found for TestType: ${timetablePart.TestType}, CategoryId: ${entry.category.CategoryDispName}, numberOfJudges: ${timetablePart.NumberOfJudges}, typeOfScores: ${RoleOfTable.Role}. User: ${req.user.username}`);
      return res.redirect('/scoring/program/' + req.params.tpid );
    }
    const event = await Event.findById(res.locals.selectedEvent._id).exec();

    res.render('scoringJudge/newscoresheetjudge', {
      judgeName: JudgeName,
      judgesTable: tablebyJudge,
      event : event,
      scoresheetTemp: scoresheetTemp,
      formData: { parent: req.params.tpid },
      timetablePart: timetablePart,
      entry: entry,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;

  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    req.session.failMessage = 'Server error';
    return res.redirect('/scoring');
  }
});


scoringRouter.post('/newscoresheet', Verify, VerifyRole(), Validate, async (req, res) => {

  logger.debug(req.body);

  const inputDatasArray = Object.entries(req.body.ScoreSheetInput).map(
    ([key, value]) => ({
      id: key,
      value: String(value),
    })
  );
  req.body.inputDatas = inputDatasArray;
  delete req.body.ScoreSheetInput;
  logger.debug(req.body);
  return res.send('Not implemented yet' );

});



export default scoringRouter;