import { logger } from '../logger.js';
import { calculateScore } from '../services/scoreCalculations.js';
import { 
    syncScoreTable, 
    getEventScoreSheets, 
    getScoreSheetById, 
    getEventScores, 
    getScoreById, 
    getSubmittedScoreSheets, 
    saveScoreSheet, 
    updateScoreSheet 
} from '../services/scoreSheetData.js';
import { 
    getTimetablePartsByEvent, 
    getTimetablePartById, 
    getJudgeById, 
    getEntryById, 
    getTableMapping, 
    getEventById, 
    getScoreSheetTemplate 
} from '../services/scoringData.js';

/**
 * @route GET /scoring/office/dashboard
 * @desc Show office scoring dashboard with all scoresheets
 */
async function getOfficeDashboard(req, res) {
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
};

/**
 * @route GET /scoring/office/scoresheet/edit/:id
 * @desc Show edit scoresheet form
 */
async function getEditScoresheetForm(req, res) {
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
};

/**
 * @route POST /scoring/office/scoresheet/edit/:id
 * @desc Update scoresheet
 */
async function updateScoresheetById(req, res) {
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
};

/**
 * @route GET /scoring/office/scoresheet/new
 * @desc Show new scoresheet selection form
 */
async function getNewScoresheetSelectionForm(req, res) {
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
};

/**
 * @route POST /scoring/office/scoresheet/new
 * @desc Handle new scoresheet selection
 */
async function handleNewScoresheetSelection(req, res) {
    try {
        req.session.judgeID = req.body.Table;
        res.redirect('/scoring/office/newscoresheet/' + req.body.entry + '/' + req.body.TTprogram);

        req.session.failMessage = null;
        req.session.successMessage = null;
    } catch (err) {
        logger.error(err + ' User: ' + req.user.username);
        req.session.failMessage = 'Server error ' + err.message;
        return res.redirect('/scoring/office/dashboard');
    }
};

/**
 * @route GET /scoring/office/newscoresheet/:entryid/:tpid
 * @desc Show new scoresheet form for office
 */
async function getOfficeNewScoresheetForm(req, res) {
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
};

/**
 * @route POST /scoring/office/newscoresheet
 * @desc Create new scoresheet from office
 */
async function createOfficeNewScoresheet(req, res) {
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
};

/**
 * @route GET /scoring/office/scores
 * @desc Show all scores
 */
async function getScoresList(req, res) {
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
};

/**
 * @route POST /scoring/office/scores/recalculate/:id
 * @desc Recalculate score
 */
async function recalculateScoreById(req, res) {
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
};

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
