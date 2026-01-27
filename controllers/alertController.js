import { logger } from '../logger.js';
import {
    getAllAlerts,
    getAlertById,
    createAlert,
    updateAlert,
    deleteAlert,
    getAlertFormData
} from '../services/alertData.js';

/**
 * @route GET /alerts/new
 * @desc Show new alert form
 */
async function getNewAlertForm(req, res) {
    try {
        const { permissionList } = await getAlertFormData();
        res.render('alert/newAlert', {
            permissionList,
            formData: req.session.formData,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null;
        req.session.successMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = err.message || 'Server error';
        return res.redirect('/alerts/dashboard');
    }
};

/**
 * @route POST /alerts/new
 * @desc Create new alert
 */
async function createNewAlertHandler(req, res) {
    try {
        const newAlert = await createAlert(req.body);
        logger.db(`Alert ${newAlert._id} created by user ${req.user.username}.`);
        req.session.successMessage = 'Alert created successfully!';
        res.redirect('/alerts/dashboard');
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : (err.message || 'Server error');
        const { permissionList } = await getAlertFormData();
        return res.render('alert/newAlert', {
            permissionList,
            formData: req.body,
            successMessage: null,
            failMessage: errorMessage,
            rolePermissons: req.user?.role?.permissions,
            user: req.user
        });
    }
};

/**
 * @route GET /alerts/dashboard
 * @desc Show alerts dashboard
 */
async function getAlertsDashboard(req, res) {
    try {
        const alerts = await getAllAlerts();
        res.render('alert/alertdash', {
            alerts,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null;
        req.session.successMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = err.message || 'Server error';
        return res.redirect('/dashboard');
    }
};

/**
 * @route GET /alerts/edit/:id
 * @desc Show edit alert form
 */
async function getEditAlertForm(req, res) {
    try {
        const alert = await getAlertById(req.params.id);
        const { permissionList } = await getAlertFormData();
        res.render('alert/editAlert', {
            permissionList,
            formData: alert,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null;
        req.session.successMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = err.message || 'Server error';
        return res.redirect('/alerts/dashboard');
    }
};

/**
 * @route POST /alerts/edit/:id
 * @desc Update alert
 */
async function updateAlertHandler(req, res) {
    try {
        const alert = await updateAlert(req.params.id, req.body);
        logger.db(`Alert ${alert._id} updated by user ${req.user.username}.`);
        req.session.successMessage = 'Alert updated successfully!';
        res.redirect('/alerts/dashboard');
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : (err.message || 'Server error');
        const { permissionList } = await getAlertFormData();
        return res.render('alert/editAlert', {
            permissionList,
            formData: { ...req.body, _id: req.params.id },
            successMessage: null,
            failMessage: errorMessage,
            rolePermissons: req.user?.role?.permissions,
            user: req.user
        });
    }
};

/**
 * @route DELETE /alerts/delete/:id
 * @desc Delete alert
 */
async function deleteAlertHandler(req, res) {
    try {
        const alert = await deleteAlert(req.params.id);
        logger.db(`Alert ${alert._id} deleted by user ${req.user.username}.`);
        res.status(200).json({ message: 'Alert deleted successfully' });
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = err.message || 'Server error';
        res.status(500).json({ message: err.message || 'Server error' });
    }
};

/**
 * @route GET /alerts/checkEvent
 * @desc Check and create alerts for event (system-generated)
 */
async function checkEventAlertsHandler(req, res) {
    try {
        const eventID = res.locals.selectedEvent?._id;
        if (!eventID) {
            return res.status(400).json({ message: 'No event selected' });
        }
        const newAlertData = {
            description: 'Incomplete',
            title: 'Needed to define why needed this alert (Nincsenek jelenleg definialva milyen részeket ellenőrizzen a rendszer itt)',
            permission: 'admin_dashboard',
            active: true,
            reappear: 100,
            style: 'info'
        };
        const alert = await createAlert(newAlertData);
        logger.db(`Alert ${alert._id} created by system.`);
        req.session.successMessage = 'Alerts created successfully!';
        res.redirect('/alerts/dashboard');
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = err.message || 'Server error';
        return res.redirect('/alerts/dashboard');
    }
};

export default {
    getNewAlertForm,
    createNewAlertHandler,
    getAlertsDashboard,
    getEditAlertForm,
    updateAlertHandler,
    deleteAlertHandler,
    checkEventAlertsHandler
};
