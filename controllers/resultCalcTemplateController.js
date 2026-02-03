import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
import {
    getAllCalcTemplates,
    getCalcTemplateById,
    createCalcTemplate,
    updateCalcTemplate,
    deleteCalcTemplate,
    getCalcTemplateFormData
} from '../DataServices/resultCalcTemplateData.js';

/**
 * @route GET /result/calcTemp/dashboard
 * @desc Show calculation templates dashboard
 */
const getCalcTemplatesDashboard = asyncHandler(async (req, res) => {
    res.render("resultCalc/dashboard", {
        resultCalcs: await getAllCalcTemplates(),
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route GET /result/calcTemp/new
 * @desc Show new calculation template form
 */
const getNewCalcTemplateForm = asyncHandler(async (req, res) => {
    const { categories } = await getCalcTemplateFormData();
    res.render("resultCalc/newResultCalc", {
        formData: req.session.formData || {},
        categoryList: categories,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /result/calcTemp/new
 * @desc Create new calculation template
 */
const createNewCalcTemplate = asyncHandler(async (req, res) => {
    if (Number(req.body.round2FirstP) + Number(req.body.round1FirstP) + Number(req.body.round1SecondP) !== 100) {
        req.session.failMessage = MESSAGES.VALIDATION.PERCENTAGE_SUM_ERROR;
        req.session.formData = req.body;
        return res.redirect("/result/calcTemp/new");
    }
    const calcTemp = await createCalcTemplate(req.body);
    logOperation('RESULT_CALC_TEMPLATE_CREATE', `Result calculation template created: ${calcTemp._id}`, req.user.username, HTTP_STATUS.CREATED);
    req.session.successMessage = MESSAGES.SUCCESS.RESULT_CALC_TEMPLATE_CREATED;
    res.redirect("/result/calcTemp/dashboard");
});

/**
 * @route GET /result/calcTemp/edit/:id
 * @desc Show edit calculation template form
 */
const getEditCalcTemplateForm = asyncHandler(async (req, res) => {
    const calcTemp = await getCalcTemplateById(req.params.id);
    res.render("resultCalc/editResultCalc", {
        formData: calcTemp,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /result/calcTemp/edit/:id
 * @desc Update calculation template
 */
const updateCalcTemplateById = asyncHandler(async (req, res) => {
    if (Number(req.body.round2FirstP) + Number(req.body.round1FirstP) + Number(req.body.round1SecondP) !== 100) {
        const sum = Number(req.body.round2FirstP) + Number(req.body.round1FirstP) + Number(req.body.round1SecondP);
        logError('VALIDATION_ERROR', 'Percentage sum error', `User: ${req.user.username}, sum: ${sum}`);
        req.session.failMessage = MESSAGES.VALIDATION.PERCENTAGE_SUM_ERROR;
        return res.redirect("/result/calcTemp/edit/" + req.params.id);
    }
    const updated = await updateCalcTemplate(req.params.id, req.body);
    logOperation('RESULT_CALC_TEMPLATE_UPDATE', `Result calculation template updated: ${updated?._id || req.params.id}`, req.user.username, HTTP_STATUS.OK);
    req.session.successMessage = MESSAGES.SUCCESS.RESULT_CALC_TEMPLATE_EDITED;
    res.redirect("/result/calcTemp/dashboard");
});

/**
 * @route DELETE /result/calcTemp/delete/:id
 * @desc Delete calculation template
 */
const deleteCalcTemplateById = asyncHandler(async (req, res) => {
    await deleteCalcTemplate(req.params.id);
    logOperation('RESULT_CALC_TEMPLATE_DELETE', `Result calculation template deleted: ${req.params.id}`, req.user.username, HTTP_STATUS.OK);
    res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.RESULT_CALC_TEMPLATE_DELETED);
});

export default {
    getCalcTemplatesDashboard,
    getNewCalcTemplateForm,
    createNewCalcTemplate,
    getEditCalcTemplateForm,
    updateCalcTemplateById,
    deleteCalcTemplateById
};
