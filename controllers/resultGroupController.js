import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
import {
    getResultGroupsByEvent,
    getResultGroupById,
    getGroupFormData,
    updateResultGroup,
    createResultGroup,
    deleteResultGroup,
    generateGroupsForActiveGenerators
} from '../DataServices/resultGroupData.js';

/**
 * @route GET /result/groups/dashboard
 * @desc Show result groups dashboard
 */
const getResultGroupsDashboard = asyncHandler(async (req, res) => {
    const resultGroups = await getResultGroupsByEvent(res.locals.selectedEvent?._id);
    res.render("resultGroup/dashboard", {
        resultGroups: resultGroups,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route GET /result/groups/edit/:id
 * @desc Show edit result group form
 */
const getEditResultGroupForm = asyncHandler(async (req, res) => {
    const resultGroups = await getResultGroupById(req.params.id);
    if (!resultGroups) {
        req.session.failMessage = MESSAGES.ERROR.RESULT_GROUP_NOT_FOUND;
        return res.redirect('/result/groups/dashboard');
    }
    const { categories, calcTemplates, timetableParts, timetablePartsRound1, timetablePartsRound2 } = await getGroupFormData(res.locals.selectedEvent?._id);
  
    res.render("resultGroup/editResultGroup", {
        categories: categories,
        formData: resultGroups,
        resultCalcs: calcTemplates,
        timetableParts: timetableParts,
        timetablePartsRound1: timetablePartsRound1,
        timetablePartsRound2: timetablePartsRound2,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /result/groups/edit/:id
 * @desc Update result group
 */
const updateResultGroupById = asyncHandler(async (req, res) => {
    const resultGroupDoc = await updateResultGroup(req.params.id, req.body);
    logOperation('RESULT_GROUP_UPDATE', `Result group updated: ${resultGroupDoc?._id || req.params.id}`, req.user.username, HTTP_STATUS.OK);
    req.session.successMessage = MESSAGES.SUCCESS.RESULT_GROUP_EDITED;
    res.redirect("/result/groups/dashboard");
});

/**
 * @route GET /result/groups/new
 * @desc Show new result group form
 */
const getNewResultGroupForm = asyncHandler(async (req, res) => {
    const { categories, calcTemplates, timetableParts, timetablePartsRound1, timetablePartsRound2 } = await getGroupFormData(res.locals.selectedEvent?._id);
    res.render("resultGroup/newResultGroup", {
        categories: categories,
        formData: req.session.formData || {},
        resultCalcs: calcTemplates,
        timetableParts: timetableParts,
        timetablePartsRound1: timetablePartsRound1,
        timetablePartsRound2: timetablePartsRound2,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /result/groups/new
 * @desc Create new result group
 */
const createNewResultGroup = asyncHandler(async (req, res) => {
    const newResultGroup = await createResultGroup(res.locals.selectedEvent?._id, req.body);
    logOperation('RESULT_GROUP_CREATE', `Result group created: ${newResultGroup._id}`, req.user.username, HTTP_STATUS.CREATED);
    req.session.successMessage = MESSAGES.SUCCESS.RESULT_GROUP_CREATED;
    res.redirect("/result/groups/dashboard");
});

/**
 * @route DELETE /result/groups/delete/:id
 * @desc Delete result group
 */
const deleteResultGroupById = asyncHandler(async (req, res) => {
    const resultGroupDoc = await deleteResultGroup(req.params.id);
    logOperation('RESULT_GROUP_DELETE', `Result group deleted: ${resultGroupDoc?._id || req.params.id}`, req.user.username, HTTP_STATUS.OK);
    req.session.successMessage = MESSAGES.SUCCESS.RESULT_GROUP_DELETED;
    res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.RESULT_GROUP_DELETED);
});

/**
 * @route POST /result/groups/generate
 * @desc Generate result groups for active generators
 */
const generateResultGroups = asyncHandler(async (req, res) => {
    await generateGroupsForActiveGenerators(res.locals.selectedEvent?._id, req.user.username);
    req.session.successMessage = MESSAGES.SUCCESS.RESULT_GROUPS_GENERATED;
    res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.RESULT_GROUPS_GENERATED);
});

export default {
    getResultGroupsDashboard,
    getEditResultGroupForm,
    updateResultGroupById,
    getNewResultGroupForm,
    createNewResultGroup,
    deleteResultGroupById,
    generateResultGroups
};
