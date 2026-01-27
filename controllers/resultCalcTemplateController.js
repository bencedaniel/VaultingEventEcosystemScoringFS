import { logger } from '../logger.js';
import {
    getAllCalcTemplates,
    getCalcTemplateById,
    createCalcTemplate,
    updateCalcTemplate,
    deleteCalcTemplate,
    getCalcTemplateFormData
} from '../services/resultCalcTemplateData.js';

/**
 * @route GET /result/calcTemp/dashboard
 * @desc Show calculation templates dashboard
 */
async function getCalcTemplatesDashboard(req, res) {
    try {
        res.render("resultCalc/dashboard", {
            resultCalcs: await getAllCalcTemplates(),
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null;
        req.session.successMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        req.session.failMessage = errorMessage;
        return res.redirect('/dashboard');
    }
};

/**
 * @route GET /result/calcTemp/new
 * @desc Show new calculation template form
 */
async function getNewCalcTemplateForm(req, res) {
    try {
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
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        req.session.failMessage = errorMessage;
        return res.redirect('/result/calcTemp/dashboard');
    }
};

/**
 * @route POST /result/calcTemp/new
 * @desc Create new calculation template
 */
async function createNewCalcTemplate(req, res) {
    try {
        if (Number(req.body.round2FirstP) + Number(req.body.round1FirstP) + Number(req.body.round1SecondP) !== 100) {
            req.session.failMessage = "The sum of the percentages must be 100%.";
            req.session.formData = req.body;
            return res.redirect("/result/calcTemp/new");
        }
        const calcTemp = await createCalcTemplate(req.body);
        logger.db(`Result calculation template ${calcTemp._id} created by user ${req.user.username}.`);
        req.session.successMessage = "Result calculation template created successfully.";
        res.redirect("/result/calcTemp/dashboard");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        const { categories } = await getCalcTemplateFormData();
        return res.render("resultCalc/newResultCalc", {
            formData: req.body,
            categoryList: categories,
            rolePermissons: req.user?.role?.permissions,
            failMessage: errorMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
    }
};

/**
 * @route GET /result/calcTemp/edit/:id
 * @desc Show edit calculation template form
 */
async function getEditCalcTemplateForm(req, res) {
    try {
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
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        req.session.failMessage = errorMessage;
        return res.redirect('/result/calcTemp/dashboard');
    }
};

/**
 * @route POST /result/calcTemp/edit/:id
 * @desc Update calculation template
 */
async function updateCalcTemplateById(req, res) {
    try {
        if (Number(req.body.round2FirstP) + Number(req.body.round1FirstP) + Number(req.body.round1SecondP) !== 100) {
            const sum = Number(req.body.round2FirstP) + Number(req.body.round1FirstP) + Number(req.body.round1SecondP);
            logger.error('Percentage sum error by user: ' + req.user.username + sum);
            req.session.failMessage = "The sum of the percentages must be 100%.";
            return res.redirect("/result/calcTemp/edit/" + req.params.id);
        }
        const updated = await updateCalcTemplate(req.params.id, req.body);
        logger.db(`Result calculation template ${updated?._id || req.params.id} edited by user ${req.user.username}.`);
        req.session.successMessage = "Result calculation template edited successfully.";
        res.redirect("/result/calcTemp/dashboard");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        return res.render("resultCalc/editResultCalc", {
            formData: { ...req.body, _id: req.params.id },
            rolePermissons: req.user?.role?.permissions,
            failMessage: errorMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
    }
};

/**
 * @route DELETE /result/calcTemp/delete/:id
 * @desc Delete calculation template
 */
async function deleteCalcTemplateById(req, res) {
    try {
        await deleteCalcTemplate(req.params.id);
        logger.db(`Result calculation template ${req.params.id} deleted by user ${req.user.username}.`);
        res.status(200).send("Calculation template deleted successfully.");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : (err.message || 'Server error');
        req.session.failMessage = errorMessage;
        return res.status(400).send(errorMessage);
    }
};

export default {
    getCalcTemplatesDashboard,
    getNewCalcTemplateForm,
    createNewCalcTemplate,
    getEditCalcTemplateForm,
    updateCalcTemplateById,
    deleteCalcTemplateById
};
