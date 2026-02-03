import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
import {
    getAllAlerts,
    getAlertById,
    createAlert,
    updateAlert,
    deleteAlert,
    getAlertFormData
} from '../DataServices/alertData.js';

/**
 * @route GET /alerts/new
 * @desc Show new alert form
 */
const getNewAlertForm = asyncHandler(async function (req, res) {
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
});

/**
 * @route POST /alerts/new
 * @desc Create new alert
 */
const createNewAlertHandler = asyncHandler(async function (req, res) {
    const newAlert = await createAlert(req.body);
    logOperation('ALERT_CREATE', `Alert created: ${newAlert._id}`, req.user.username, HTTP_STATUS.CREATED);
    req.session.successMessage = MESSAGES.SUCCESS.ALERT_CREATED;
    res.redirect('/alerts/dashboard');
});

/**
 * @route GET /alerts/dashboard
 * @desc Show alerts dashboard
 */
const getAlertsDashboard = asyncHandler(async function (req, res) {
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
});

/**
 * @route GET /alerts/edit/:id
 * @desc Show edit alert form
 */
const getEditAlertForm = asyncHandler(async function (req, res) {
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
});

/**
 * @route POST /alerts/edit/:id
 * @desc Update alert
 */
const updateAlertHandler = asyncHandler(async function (req, res) {
    const alert = await updateAlert(req.params.id, req.body);
    logOperation('ALERT_UPDATE', `Alert updated: ${alert._id}`, req.user.username, HTTP_STATUS.OK);
    req.session.successMessage = MESSAGES.SUCCESS.ALERT_UPDATED;
    res.redirect('/alerts/dashboard');
});

/**
 * @route DELETE /alerts/delete/:id
 * @desc Delete alert
 */
const deleteAlertHandler = asyncHandler(async function (req, res) {
    const alert = await deleteAlert(req.params.id);
    logOperation('ALERT_DELETE', `Alert deleted: ${alert._id}`, req.user.username, HTTP_STATUS.OK);
    res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.ALERT_DELETED });
});

/**
 * @route GET /alerts/checkEvent
 * @desc Check and create alerts for event (system-generated)
 */
const checkEventAlertsHandler = asyncHandler(async function (req, res) {
    const eventID = res.locals.selectedEvent?._id;
    if (!eventID) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: MESSAGES.ERROR.NO_EVENT_SELECTED });
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
    logOperation('ALERT_CREATE', `Alert created: ${alert._id}`, 'system', HTTP_STATUS.CREATED);
    req.session.successMessage = MESSAGES.SUCCESS.ALERTS_CREATED;
    res.redirect('/alerts/dashboard');
});

export default {
    getNewAlertForm,
    createNewAlertHandler,
    getAlertsDashboard,
    getEditAlertForm,
    updateAlertHandler,
    deleteAlertHandler,
    checkEventAlertsHandler
};
