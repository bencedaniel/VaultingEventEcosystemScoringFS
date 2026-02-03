import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { MESSAGES } from '../config/index.js';
import { calculateScore } from '../LogicServices/scoreCalculations.js';
import { syncScoreTable } from '../LogicServices/scoreSync.js';
import { getSubmittedScoreSheets, saveScoreSheet } from '../DataServices/scoreSheetData.js';
import { 
    getTodaysTimetable, 
    getTimetablePartsByDaily, 
    getTimetablePartById, 
    getJudgeById, 
    getEntriesByEvent, 
    getEntryById, 
    getTableMapping, 
    getEventById, 
    getScoreSheetTemplate 
} from '../DataServices/scoringData.js';

/**
 * @route GET /scoring
 * @desc Show judge scoring dashboard with today's timetable parts
 */
const getScoringDashboard = asyncHandler(async function (req, res) {
    const day = await getTodaysTimetable();
    if (!day) {
        req.session.failMessage = MESSAGES.ERROR.TIMETABLE_PART_NOT_FOUND;
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
});

/**
 * @route GET /scoring/program/:id
 * @desc Show program details for a specific timetable part for judge
 */
const getProgramDetails = asyncHandler(async function (req, res) {
    const timetablePart = await getTimetablePartById(req.params.id);

    if (timetablePart.drawingDone === false) {
        req.session.failMessage = MESSAGES.ERROR.TIMETABLE_PART_NOT_FOUND;
        return res.redirect('/scoring');
    }
    if (timetablePart.conflictsChecked === false) {
        req.session.failMessage = MESSAGES.ERROR.TIMETABLE_PART_NOT_FOUND;
        return res.redirect('/scoring');
    }
    if (!timetablePart) {
        req.session.failMessage = MESSAGES.ERROR.TIMETABLE_PART_NOT_FOUND;
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
});

/**
 * @route GET /scoring/newscoresheet/:entryid/:tpid
 * @desc Show new scoresheet form for judge
 */
const getNewScoresheetForm = asyncHandler(async function (req, res) {
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
        req.session.failMessage = MESSAGES.ERROR.SCORE_ALREADY_SUBMITTED;
        return res.redirect('/scoring/program/' + req.params.tpid);
    }
    
    // Check if judge is authorized for this timetable part
    if (timetablePart.JudgesList.length === 0) {
        req.session.failMessage = MESSAGES.ERROR.NOT_ASSIGNED_AS_JUDGE;
        return res.redirect('/scoring');
    }
    
    const judgeUser = await getJudgeById(timetablePart.JudgesList[0].JudgeUserID);
    const judgeName = judgeUser.fullname;
    const tableByJudge = timetablePart.JudgesList[0].Table;
    
    // Get table mapping for role determination
    const roleOfTable = await getTableMapping(tableByJudge, timetablePart.TestType);
    if (!roleOfTable) {
        logWarn('NO_ROLE_MAPPING', `No RoleOfTable found for Table: ${tableByJudge}, TestType: ${timetablePart.TestType.toLocaleLowerCase()}`, `User: ${req.user.username}`);
        req.session.failMessage = MESSAGES.ERROR.NO_ROLE_MAPPING;
        return res.redirect('/scoring');
    }
    
    // Get entry details
    const entry = await getEntryById(req.params.entryid);
    if (!entry) {
        req.session.failMessage = MESSAGES.ERROR.ENTRY_NOT_FOUND;
        return res.redirect('/scoring');
    }
    
    if (!timetablePart) {
        req.session.failMessage = MESSAGES.ERROR.TIMETABLE_PART_NOT_FOUND;
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
        req.session.failMessage = MESSAGES.ERROR.NO_SCORE_SHEET_TEMPLATE;
        logWarn('NO_SCORESHEET_TEMPLATE', `No ScoreSheetTemp found for TestType: ${timetablePart.TestType}, CategoryId: ${entry.category.CategoryDispName}, numberOfJudges: ${timetablePart.NumberOfJudges}, typeOfScores: ${roleOfTable.Role}`, `User: ${req.user.username}`);
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
});

/**
 * @route POST /scoring/newscoresheet
 * @desc Create new scoresheet for judge
 */
const createNewScoresheet = asyncHandler(async function (req, res) {
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
        return res.redirect('/scoring/program/' + req.body.TimetablePartId);

});

export default {
    getScoringDashboard,
    getProgramDetails,
    getNewScoresheetForm,
    createNewScoresheet
};
