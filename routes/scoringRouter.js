import express from 'express';

import {logger} from '../logger.js';
import { Login } from "../controllers/auth.js";
import { Logout } from "../controllers/auth.js";
import Validate from "../middleware/Validate.js";
import { check } from "express-validator";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import { calculateScore } from '../services/scoreCalculations.js';
import { syncScoreTable, getEventScoreSheets, getScoreSheetById, getEventScores, getScoreById, getSubmittedScoreSheets, saveScoreSheet, updateScoreSheet } from '../services/scoreSheetData.js';
import { getTodaysTimetable, getTimetablePartsByDaily, getTimetablePartById, getTimetablePartByIdWithDaily, getTimetablePartsByEvents, getJudgeById, getEntriesByEvent, getEntryById, getTableMapping, getEventById, getScoreSheetTemplate, getTimetablePartsByEvent } from '../services/scoringData.js';



const scoringRouter = express.Router();

scoringRouter.get('/', Verify, VerifyRole(), async (req, res) => {
  try {
    const day = await getTodaysTimetable();
    if (!day) {
      req.session.failMessage = 'No timetable for today';
      return res.redirect('/dashboard');
    }

    const timetableParts = await getTimetablePartsByDaily(day._id);

    res.render('scoringJudge/dashboard', {
      timetableParts: timetableParts,
      day: day,
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
    return res.redirect('/admin/dashboard');
  }
});

scoringRouter.get('/program/:id', Verify, VerifyRole(), async (req, res) => {
  try {
    const timetablePart = await getTimetablePartById(req.params.id);

    if (timetablePart.drawingDone === false) {
      req.session.failMessage = 'Drawing not done yet for this timetable part';
      return res.redirect('/scoring');
    }
    if (timetablePart.conflictsChecked === false) {
      req.session.failMessage = 'Conflicts not checked yet for this timetable part';
      return res.redirect('/scoring');
    }
    if (!timetablePart) {
      req.session.failMessage = 'Timetable part not found';
      return res.redirect('/scoring');
    }

    let JudgeName = '';
    let tablebyJudge = '';
    timetablePart.JudgesList = timetablePart.JudgesList.filter(
      j => j.JudgeUserID.toString() === req.user._id.toString()
    );
    if (timetablePart.JudgesList.length === 0) {
      JudgeName = 'Not authorized judge';
    } else {
      const JudgeUser = await getJudgeById(timetablePart.JudgesList[0].JudgeUserID);
      JudgeName = JudgeUser.fullname;
      tablebyJudge = timetablePart.JudgesList[0].Table;
    }

    const ScoreSheetsSubmitted = await getSubmittedScoreSheets(
      req.params.id,
      null,
      res.locals.selectedEvent._id,
      req.user._id
    );
    const entries = await getEntriesByEvent(res.locals.selectedEvent._id);

    res.render('scoringJudge/perprogram', {
      ScoreSheetsSubmitted: ScoreSheetsSubmitted,
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
    const judgeID = req.user._id;
    
    const timetablePart = await getTimetablePartById(req.params.tpid);
    
    // Filter judges list to only current judge
    timetablePart.JudgesList = timetablePart.JudgesList.filter(j => j.JudgeUserID.toString() === judgeID.toString());
    
    // Check if judge already submitted for this entry
    const scoreSheetsSubmitted = await getSubmittedScoreSheets(
      req.params.tpid,
      req.params.entryid,
      res.locals.selectedEvent._id,
      judgeID
    );
    
    if (scoreSheetsSubmitted.length > 0) {
      req.session.failMessage = 'You have already submitted a score sheet for this entry in this timetable part';
      return res.redirect('/scoring/program/' + req.params.tpid);
    }
    
    // Check if judge is authorized for this timetable part
    if (timetablePart.JudgesList.length === 0) {
      req.session.failMessage = 'You are not assigned as a judge for this timetable part';
      return res.redirect('/scoring');
    }
    
    const judgeUser = await getJudgeById(timetablePart.JudgesList[0].JudgeUserID);
    const judgeName = judgeUser.fullname;
    const tableByJudge = timetablePart.JudgesList[0].Table;
    
    // Get table mapping for role determination
    const roleOfTable = await getTableMapping(tableByJudge, timetablePart.TestType);
    if (!roleOfTable) {
      logger.warn(`No RoleOfTable found for Table: ${tableByJudge}, TestType: ${timetablePart.TestType.toLocaleLowerCase()}. User: ${req.user.username}`);
      req.session.failMessage = 'No role mapping found for your judge table in this timetable part';
      return res.redirect('/scoring');
    }
    
    // Get entry details
    const entry = await getEntryById(req.params.entryid);
    if (!entry) {
      req.session.failMessage = 'Entry not found';
      return res.redirect('/scoring');
    }
    
    if (!timetablePart) {
      req.session.failMessage = 'Timetable part not found';
      return res.redirect('/scoring');
    }
    
    // Get score sheet template
    const scoresheetTemp = await getScoreSheetTemplate(
      timetablePart.TestType,
      entry.category._id,
      timetablePart.NumberOfJudges,
      roleOfTable.Role
    );
    
    if (!scoresheetTemp) {
      req.session.failMessage = 'No score sheet template found for this configuration';
      logger.warn(`No ScoreSheetTemp found for TestType: ${timetablePart.TestType}, CategoryId: ${entry.category.CategoryDispName}, numberOfJudges: ${timetablePart.NumberOfJudges}, typeOfScores: ${roleOfTable.Role}. User: ${req.user.username}`);
      return res.redirect('/scoring/program/' + req.params.tpid);
    }
    
    // Get event details
    const event = await getEventById(res.locals.selectedEvent._id);
    
    res.render('scoringJudge/newscoresheetjudge', {
      judgeName: judgeName,
      judgesTable: tableByJudge,
      event: event,
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
  try {
    const inputDatasArray = Object.entries(req.body.ScoreSheetInput).map(([key, value]) => ({
      id: key,
      value: String(value)
    }));
    req.body.inputDatas = inputDatasArray;
    delete req.body.ScoreSheetInput;

    const entry = await getEntryById(req.body.EntryId);
    req.body.totalScoreBE = calculateScore(inputDatasArray, entry.category);

    await saveScoreSheet(req.body, req.body.TimetablePartId, req.body.EntryId);
    await syncScoreTable(req.body.TimetablePartId, req.body.EntryId, res.locals.selectedEvent._id);

    req.session.successMessage = 'Score sheet saved successfully!';
    return res.redirect('/scoring/program/' + req.body.TimetablePartId);
  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    const errorMessage = err.errors
      ? Object.values(err.errors).map(e => e.message).join(' ')
      : 'Server error';
    req.session.failMessage = 'Server error: ' + errorMessage;
    return res.redirect('/scoring/program/' + req.body.TimetablePartId);
  }
});



//OFFICE ROUTES


scoringRouter.get('/office/dashboard', Verify, VerifyRole(), async (req, res) => {
  const scoreSheets = await getEventScoreSheets(res.locals.selectedEvent._id);

  res.render('scoringOffice/dashboard', {
    scoreSheets: scoreSheets,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

scoringRouter.get('/office/scoresheet/edit/:id', Verify, VerifyRole(), async (req, res) => {
  try {
    const scoresheet = await getScoreSheetById(req.params.id);

    res.render('scoringJudge/editscoresheetjudge', {
      scoresheet: scoresheet,
      judgeName: scoresheet.Judge.userId.fullname,
      judgesTable: scoresheet.Judge.table,
      event: scoresheet.EventId,
      scoresheetTemp: scoresheet.TemplateId,
      timetablePart: scoresheet.TimetablePartId,
      entry: scoresheet.EntryId,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    req.session.failMessage = 'Server error';
    return res.redirect('/scoring/office/dashboard');
  }
});


scoringRouter.post('/office/scoresheet/edit/:id', Verify, VerifyRole(), Validate, async (req, res) => {
  try {
    const inputDatasArray = Object.entries(req.body.ScoreSheetInput).map(([key, value]) => ({
      id: key,
      value: String(value)
    }));
    req.body.inputDatas = inputDatasArray;
    delete req.body.ScoreSheetInput;

    const entry = await getEntryById(req.body.EntryId);
    req.body.totalScoreBE = calculateScore(inputDatasArray, entry.category);

    await updateScoreSheet(req.params.id, req.body, req.body.TimetablePartId, req.body.EntryId);
    await syncScoreTable(req.body.TimetablePartId, req.body.EntryId, res.locals.selectedEvent._id);

    req.session.successMessage = 'Score sheet saved successfully!';
    return res.redirect('/scoring/office/dashboard');
  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    const errorMessage = err.errors
      ? Object.values(err.errors).map(e => e.message).join(' ')
      : 'Server error';
    req.session.failMessage = 'Server error: ' + errorMessage;
    return res.redirect('/scoring/office/dashboard');
  }
});

scoringRouter.post('/office/scoresheet/edit1/:id', Verify, VerifyRole(), Validate, async (req, res) => {
  try {
    const inputDatasArray = Object.entries(req.body.ScoreSheetInput).map(([key, value]) => ({
      id: key,
      value: String(value)
    }));
    req.body.inputDatas = inputDatasArray;
    delete req.body.ScoreSheetInput;

    const entry = await getEntryById(req.body.EntryId);
    req.body.totalScoreBE = calculateScore(inputDatasArray, entry.category);

    await updateScoreSheet(req.params.id, req.body, req.body.TimetablePartId, req.body.EntryId);
    await syncScoreTable(req.body.TimetablePartId, req.body.EntryId, res.locals.selectedEvent._id);

    req.session.successMessage = 'Score sheet saved successfully!';
    return res.redirect('/scoring/office/dashboard');
  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    const errorMessage = err.errors
      ? Object.values(err.errors).map(e => e.message).join(' ')
      : 'Server error';
    req.session.failMessage = 'Server error: ' + errorMessage;
    return res.redirect('/scoring/office/dashboard');
  }
});



scoringRouter.get('/office/scoresheet/new', Verify, VerifyRole(), async (req, res) => {
  try {
    const timetableParts = await getTimetablePartsByEvent(res.locals.selectedEvent._id);

    res.render('scoringOffice/createscoresheet', {
      timetableParts: timetableParts,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    req.session.failMessage = 'Server error ' + err.message;
    return res.redirect('/scoring/office/dashboard');
  }
});



scoringRouter.post('/office/scoresheet/new', Verify, VerifyRole(), async (req, res) => {
  try {

    req.session.judgeID = req.body.Table;
    res.redirect('/scoring/office/newscoresheet/' + req.body.entry + '/' + req.body.TTprogram );




    req.session.failMessage = null;
    req.session.successMessage = null;
  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    req.session.failMessage = 'Server error ' + err.message;
    return res.redirect('/scoring/office/dashboard');
  }

});


scoringRouter.get('/office/newscoresheet/:entryid/:tpid', Verify, VerifyRole(), async (req, res) => {
  try {
    const judgeID = req.session.judgeID;
    
    const timetablePart = await getTimetablePartById(req.params.tpid);
    
    // Filter judges list to only current judge
    timetablePart.JudgesList = timetablePart.JudgesList.filter(j => j.JudgeUserID.toString() === judgeID.toString());
    
    // Check if judge already submitted for this entry
    const scoreSheetsSubmitted = await getSubmittedScoreSheets(
      req.params.tpid,
      req.params.entryid,
      res.locals.selectedEvent._id,
      judgeID
    );
    
    if (scoreSheetsSubmitted.length > 0) {
      req.session.failMessage = 'You have already submitted a score sheet for this entry in this timetable part';
      return res.redirect('/scoring/office/dashboard');
    }
    
    // Check if judge is authorized for this timetable part
    if (timetablePart.JudgesList.length === 0) {
      req.session.failMessage = 'You are not assigned as a judge for this timetable part';
      return res.redirect('/scoring/office/dashboard');
    }
    
    const judgeUser = await getJudgeById(timetablePart.JudgesList[0].JudgeUserID);
    const judgeName = judgeUser.fullname;
    const tableByJudge = timetablePart.JudgesList[0].Table;
    
    // Get table mapping for role determination
    const roleOfTable = await getTableMapping(tableByJudge, timetablePart.TestType);
    if (!roleOfTable) {
      logger.warn(`No RoleOfTable found for Table: ${tableByJudge}, TestType: ${timetablePart.TestType.toLocaleLowerCase()}. User: ${req.user.username}`);
      req.session.failMessage = 'No role mapping found for your judge table in this timetable part';
      return res.redirect('/scoring/office/dashboard');
    }
    
    // Get entry details
    const entry = await getEntryById(req.params.entryid);
    if (!entry) {
      req.session.failMessage = 'Entry not found';
      return res.redirect('/scoring/office/dashboard');
    }
    
    if (!timetablePart) {
      req.session.failMessage = 'Timetable part not found';
      return res.redirect('/scoring/office/dashboard');
    }
    
    // Get score sheet template
    const scoresheetTemp = await getScoreSheetTemplate(
      timetablePart.TestType,
      entry.category._id,
      timetablePart.NumberOfJudges,
      roleOfTable.Role
    );
    
    if (!scoresheetTemp) {
      req.session.failMessage = 'No score sheet template found for this configuration';
      logger.warn(`No ScoreSheetTemp found for TestType: ${timetablePart.TestType}, CategoryId: ${entry.category.CategoryDispName}, numberOfJudges: ${timetablePart.NumberOfJudges}, typeOfScores: ${roleOfTable.Role}. User: ${req.user.username}`);
      return res.redirect('/scoring/office/dashboard');
    }
    
    // Get event details
    const event = await getEventById(res.locals.selectedEvent._id);
    
    res.render('scoringJudge/officenewscoresheetjudge', {
      judgeID: judgeID,
      judgeName: judgeName,
      judgesTable: tableByJudge,
      event: event,
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
    return res.redirect('/scoring/office/dashboard');
  }
});


scoringRouter.post('/office/newscoresheet', Verify, VerifyRole(), Validate, async (req, res) => {
  try {
    const inputDatasArray = Object.entries(req.body.ScoreSheetInput).map(([key, value]) => ({
      id: key,
      value: String(value)
    }));
    req.body.inputDatas = inputDatasArray;
    delete req.body.ScoreSheetInput;

    const entry = await getEntryById(req.body.EntryId);
    req.body.totalScoreBE = calculateScore(inputDatasArray, entry.category);

    await saveScoreSheet(req.body, req.body.TimetablePartId, req.body.EntryId);
    await syncScoreTable(req.body.TimetablePartId, req.body.EntryId, res.locals.selectedEvent._id);

    req.session.successMessage = 'Score sheet saved successfully!';
    return res.redirect('/scoring/office/dashboard');
  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    const errorMessage = err.errors
      ? Object.values(err.errors).map(e => e.message).join(' ')
      : 'Server error';
    req.session.failMessage = 'Server error: ' + errorMessage;
    return res.redirect('/scoring/office/dashboard');
  }
});





scoringRouter.get('/office/scores', Verify, VerifyRole(), async (req, res) => {
  try {
    const scores = await getEventScores(res.locals.selectedEvent._id);
    res.render('scoringOffice/scores', {
      scores: scores,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    const ErrMessage = err.errors
      ? Object.values(err.errors).map(e => e.message).join(' ')
      : 'Server error';
    req.session.failMessage = 'Server error: ' + ErrMessage;
    return res.redirect('/scoring/office/dashboard');
  }
});



scoringRouter.post('/office/scores/recalculate/:id', Verify, VerifyRole(), async (req, res) => {
  try {
    const score = await getScoreById(req.params.id);
    if (!score) {
      req.session.failMessage = 'Score not found';
      return res.redirect('/scoring/office/scores');
    }
    req.session.successMessage = 'Score recalculated successfully';
    await syncScoreTable(score.timetablepart, score.entry, res.locals.selectedEvent._id);

    return res.status(200).send('Score recalculated successfully');
  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    const ErrMessage = err.errors
      ? Object.values(err.errors).map(e => e.message).join(' ')
      : 'Server error';
    req.session.failMessage = 'Server error: ' + ErrMessage;
    return res.status(500).redirect('/scoring/office/scores');
  }
});








export default scoringRouter;
































