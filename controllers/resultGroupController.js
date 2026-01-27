import { logger } from '../logger.js';
import {
    getResultGroupsByEvent,
    getResultGroupById,
    getGroupFormData,
    updateResultGroup,
    createResultGroup,
    deleteResultGroup,
    generateGroupsForActiveGenerators
} from '../services/resultGroupData.js';

/**
 * @route GET /result/groups/dashboard
 * @desc Show result groups dashboard
 */
async function getResultGroupsDashboard(req, res) {
    try {
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
 * @route GET /result/groups/edit/:id
 * @desc Show edit result group form
 */
async function getEditResultGroupForm(req, res) {
    try {
        const resultGroups = await getResultGroupById(req.params.id);
        if (!resultGroups) {
            req.session.failMessage = "Result group not found.";
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
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        req.session.failMessage = errorMessage;
        return res.redirect('/result/groups/dashboard');
    }
};

/**
 * @route POST /result/groups/edit/:id
 * @desc Update result group
 */
async function updateResultGroupById(req, res) {
    try {
        const resultGroupDoc = await updateResultGroup(req.params.id, req.body);
        logger.db(`Result group ${resultGroupDoc?._id || req.params.id} edited by user ${req.user.username}.`);
        req.session.successMessage = "Result group edited successfully.";
        res.redirect("/result/groups/dashboard");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err?.message || (err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error');
        const { categories, calcTemplates, timetableParts, timetablePartsRound1, timetablePartsRound2 } = await getGroupFormData(res.locals.selectedEvent?._id);
        return res.render("resultGroup/editResultGroup", {
            categories: categories,
            formData: { ...req.body, _id: req.params.id },
            resultCalcs: calcTemplates,
            timetableParts: timetableParts,
            timetablePartsRound1: timetablePartsRound1,
            timetablePartsRound2: timetablePartsRound2,
            rolePermissons: req.user?.role?.permissions,
            failMessage: errorMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
    }
};

/**
 * @route GET /result/groups/new
 * @desc Show new result group form
 */
async function getNewResultGroupForm(req, res) {
    try {
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
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        req.session.failMessage = errorMessage;
        return res.redirect('/result/groups/dashboard');
    }
};

/**
 * @route POST /result/groups/new
 * @desc Create new result group
 */
async function createNewResultGroup(req, res) {
    try {
        const newResultGroup = await createResultGroup(res.locals.selectedEvent?._id, req.body);
        logger.db(`Result group ${newResultGroup._id} created by user ${req.user.username}.`);
        req.session.successMessage = "Result group created successfully.";
        res.redirect("/result/groups/dashboard");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err?.message || (err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error');
        const { categories, calcTemplates, timetableParts, timetablePartsRound1, timetablePartsRound2 } = await getGroupFormData(res.locals.selectedEvent?._id);
        return res.render("resultGroup/newResultGroup", {
            categories: categories,
            formData: req.body,
            resultCalcs: calcTemplates,
            timetableParts: timetableParts,
            timetablePartsRound1: timetablePartsRound1,
            timetablePartsRound2: timetablePartsRound2,
            rolePermissons: req.user?.role?.permissions,
            failMessage: errorMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
    }
};

/**
 * @route DELETE /result/groups/delete/:id
 * @desc Delete result group
 */
async function deleteResultGroupById(req, res) {
    try {
        const resultGroupDoc = await deleteResultGroup(req.params.id);
        logger.db(`Result group ${resultGroupDoc?._id || req.params.id} deleted by user ${req.user.username}.`);
        req.session.successMessage = "Result group deleted successfully.";
        res.status(200).send("Result group deleted successfully.");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        req.session.failMessage = errorMessage;
        return res.redirect('/result/groups/dashboard');
    }
};

/**
 * @route POST /result/groups/generate
 * @desc Generate result groups for active generators
 */
async function generateResultGroups(req, res) {
    try {
        await generateGroupsForActiveGenerators(res.locals.selectedEvent?._id, req.user.username);
        req.session.successMessage = "Result groups generated successfully.";
        res.status(200).send("Result groups generated successfully.");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err?.message || (err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error');
        req.session.failMessage = errorMessage;
        return res.redirect('/result/groups/dashboard');
    }
};

export default {
    getResultGroupsDashboard,
    getEditResultGroupForm,
    updateResultGroupById,
    getNewResultGroupForm,
    createNewResultGroup,
    deleteResultGroupById,
    generateResultGroups
};
