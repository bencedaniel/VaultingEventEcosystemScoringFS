import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
import { calculateScore } from '../LogicServices/scoreCalculations.js';
import { syncScoreTable } from '../LogicServices/scoreSync.js';
import { 
    getEventScoreSheets, 
    getScoreSheetById, 
    getEventScores, 
    getScoreById, 
    getSubmittedScoreSheets, 
    saveScoreSheet, 
    updateScoreSheet 
} from '../DataServices/scoreSheetData.js';
import { 
    getTimetablePartsByEvent, 
    getTimetablePartById, 
    getJudgeById, 
    getEntryById, 
    getTableMapping, 
    getEventById, 
    getScoreSheetTemplate 
} from '../DataServices/scoringData.js';

/**
 * @route GET /scoring/office/dashboard
 * @desc Show office scoring dashboard with all scoresheets
 */
const getOfficeDashboard = asyncHandler(async function (req, res) {
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

/**
 * @route GET /scoring/office/scoresheet/edit/:id
 * @desc Show edit scoresheet form
 */
const getEditScoresheetForm = asyncHandler(async function (req, res) {
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
});

/**
 * @route POST /scoring/office/scoresheet/edit/:id
 * @desc Update scoresheet
 */
const updateScoresheetById = asyncHandler(async function (req, res, redirect) {
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

    req.session.successMessage = MESSAGES.SUCCESS.SCORE_SHEET_SAVED;
    return res.redirect(redirect);
});



/**
 * @route GET /scoring/office/scoresheet/new
 * @desc Show new scoresheet selection form
 */
const getNewScoresheetSelectionForm = asyncHandler(async function (req, res) {
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
});

/**
 * @route POST /scoring/office/scoresheet/new
 * @desc Handle new scoresheet selection
 */
const handleNewScoresheetSelection = asyncHandler(async function (req, res) {
    req.session.judgeID = req.body.Table;
    res.redirect('/scoring/office/newscoresheet/' + req.body.entry + '/' + req.body.TTprogram);

    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route GET /scoring/office/newscoresheet/:entryid/:tpid
 * @desc Show new scoresheet form for office
 */
const getOfficeNewScoresheetForm = asyncHandler(async function (req, res) {
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
        req.session.failMessage = MESSAGES.ERROR.SCORE_ALREADY_SUBMITTED;
        return res.redirect('/scoring/office/dashboard');
    }
    
    // Check if judge is authorized for this timetable part
    if (timetablePart.JudgesList.length === 0) {
        req.session.failMessage = MESSAGES.ERROR.NOT_ASSIGNED_AS_JUDGE;
        return res.redirect('/scoring/office/dashboard');
    }
    
    const judgeUser = await getJudgeById(timetablePart.JudgesList[0].JudgeUserID);
    const judgeName = judgeUser.fullname;
    const tableByJudge = timetablePart.JudgesList[0].Table;
    
    // Get table mapping for role determination
    const roleOfTable = await getTableMapping(tableByJudge, timetablePart.TestType);
    if (!roleOfTable) {
        logWarn('NO_ROLE_MAPPING', `No RoleOfTable found for Table: ${tableByJudge}, TestType: ${timetablePart.TestType.toLocaleLowerCase()}`, `User: ${req.user.username}`);
        req.session.failMessage = MESSAGES.ERROR.NO_ROLE_MAPPING;
        return res.redirect('/scoring/office/dashboard');
    }
    
    // Get entry details
    const entry = await getEntryById(req.params.entryid);
    if (!entry) {
        req.session.failMessage = MESSAGES.ERROR.ENTRY_NOT_FOUND;
        return res.redirect('/scoring/office/dashboard');
    }
    
    if (!timetablePart) {
        req.session.failMessage = MESSAGES.ERROR.TIMETABLE_PART_NOT_FOUND;
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
        req.session.failMessage = MESSAGES.ERROR.NO_SCORE_SHEET_TEMPLATE;
        logWarn('NO_SCORESHEET_TEMPLATE', `No ScoreSheetTemp found for TestType: ${timetablePart.TestType}, CategoryId: ${entry.category.CategoryDispName}, numberOfJudges: ${timetablePart.NumberOfJudges}, typeOfScores: ${roleOfTable.Role}`, `User: ${req.user.username}`);
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
});

/**
 * @route POST /scoring/office/newscoresheet
 * @desc Create new scoresheet from office
 */
const createOfficeNewScoresheet = asyncHandler(async function (req, res) {
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

        req.session.successMessage = MESSAGES.SUCCESS.SCORE_SHEET_SAVED;
        return res.redirect('/scoring/office/dashboard');

});

/**
 * @route GET /scoring/office/scores
 * @desc Show all scores
 */
const getScoresList = asyncHandler(async function (req, res) {
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
});

/**
 * @route POST /scoring/office/scores/recalculate/:id
 * @desc Recalculate score
 */
const recalculateScoreById = asyncHandler(async function (req, res) {
    const score = await getScoreById(req.params.id);
    if (!score) {
        req.session.failMessage = MESSAGES.ERROR.SCORE_NOT_FOUND;
        return res.redirect('/scoring/office/scores');
    }
    req.session.successMessage = MESSAGES.SUCCESS.SCORE_RECALCULATED;
    await syncScoreTable(score.timetablepart, score.entry, res.locals.selectedEvent._id);

    return res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.SCORE_RECALCULATED);
});

export default {
    getOfficeDashboard,
    getEditScoresheetForm,
    updateScoresheetById,
    getNewScoresheetSelectionForm,
    handleNewScoresheetSelection,
    getOfficeNewScoresheetForm,
    createOfficeNewScoresheet,
    getScoresList,
    recalculateScoreById
};
