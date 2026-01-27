import { logger } from '../logger.js';
import {
    getAllGenerators,
    getGeneratorFormData,
    createGenerator,
    updateGenerator,
    updateGeneratorStatus,
    getGeneratorById,
    deleteGenerator
} from '../services/resultGeneratorData.js';

/**
 * @route GET /result/generator/dashboard
 * @desc Show result generators dashboard
 */
async function getGeneratorsDashboard(req, res) {
    try {
        const generators = await getAllGenerators();
        res.render("resultGen/dashboard", {
            generators: generators,
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
 * @route GET /result/generator/new
 * @desc Show new result generator form
 */
async function getNewGeneratorForm(req, res) {
    try {
        const { categories, calcTemplates } = await getGeneratorFormData();
        res.render("resultGen/newResultGen", {
            formData: req.session.formData || {},
            categories: categories,
            resultCalcs: calcTemplates,
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
        return res.redirect('/result/generator/dashboard');
    }
};

/**
 * @route POST /result/generator/new
 * @desc Create new result generator
 */
async function createNewGenerator(req, res) {
    try {
        const newGenerator = await createGenerator(req.body);
        logger.db(`Result generator ${newGenerator._id} created by user ${req.user.username}.`);
        req.session.successMessage = "Result generator created successfully.";
        res.redirect("/result/generator/dashboard");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err?.message || (err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error');
        const { categories, calcTemplates } = await getGeneratorFormData();
        return res.render("resultGen/newResultGen", {
            formData: req.body,
            categories: categories,
            resultCalcs: calcTemplates,
            rolePermissons: req.user?.role?.permissions,
            failMessage: errorMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
    }
};

/**
 * @route POST /result/generator/status/:id
 * @desc Update result generator status
 */
async function updateGeneratorStatusById(req, res) {
    try {
        const generator = await updateGeneratorStatus(req.params.id, req.body.status);
        logger.db(`Result generator ${generator._id} status updated to ${req.body.status} by user ${req.user.username}.`);
        res.status(200).send("Result generator status updated successfully.");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err?.message || (err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error');
        req.session.failMessage = errorMessage;
        return res.status(500).send("Error updating result generator status. " + errorMessage);
    }
};

/**
 * @route GET /result/generator/edit/:id
 * @desc Show edit result generator form
 */
async function getEditGeneratorForm(req, res) {
    try {
        const generator = await getGeneratorById(req.params.id);
        const { categories, calcTemplates } = await getGeneratorFormData();
        res.render("resultGen/editResultGen", {
            formData: generator,
            categories: categories,
            resultCalcs: calcTemplates,
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
        return res.redirect('/result/generator/dashboard');
    }
};

/**
 * @route POST /result/generator/edit/:id
 * @desc Update result generator
 */
async function updateGeneratorById(req, res) {
    try {
        const generator = await updateGenerator(req.params.id, req.body);
        logger.db(`Result generator ${generator._id} edited by user ${req.user.username}.`);
        req.session.successMessage = "Result generator edited successfully.";
        res.redirect("/result/generator/dashboard");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err?.message || (err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error');
        const { categories, calcTemplates } = await getGeneratorFormData();
        return res.render("resultGen/editResultGen", {
            formData: { ...req.body, _id: req.params.id },
            categories: categories,
            resultCalcs: calcTemplates,
            rolePermissons: req.user?.role?.permissions,
            failMessage: errorMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
    }
};

/**
 * @route DELETE /result/generator/delete/:id
 * @desc Delete result generator
 */
async function deleteGeneratorById(req, res) {
    try {
        const generator = await deleteGenerator(req.params.id);
        logger.db(`Result generator ${generator._id} deleted by user ${req.user.username}.`);
        res.status(200).send("Result generator deleted successfully.");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        req.session.failMessage = errorMessage;
        return res.redirect('/result/generator/dashboard');
    }
};

export default {
    getGeneratorsDashboard,
    getNewGeneratorForm,
    createNewGenerator,
    updateGeneratorStatusById,
    getEditGeneratorForm,
    updateGeneratorById,
    deleteGeneratorById
};
