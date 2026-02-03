import Alert from '../models/Alert.js';
import Permissions from '../models/Permissions.js';
import { logDb } from '../logger.js';

/**
 * Get all alerts sorted by name and populated with permission data
 */
export const getAllAlerts = async () => {
    return await Alert.find().sort({ name: 1 }).populate('permission');
};

/**
 * Get alert by ID
 */
export const getAlertById = async (id) => {
    const alert = await Alert.findById(id);
    if (!alert) {
        throw new Error('Alert not found');
    }
    return alert;
};

/**
 * Create new alert
 */
export const createAlert = async (data) => {
    const newAlert = new Alert(data);
    await newAlert.save();
    logDb('CREATE', 'Alert', `${newAlert.title}`);
    return newAlert;
};

/**
 * Update alert by ID
 */
export const updateAlert = async (id, data) => {
    const alert = await Alert.findByIdAndUpdate(id, data, { runValidators: true });
    if (!alert) {
        throw new Error('Alert not found');
    }
    logDb('UPDATE', 'Alert', `${alert.title}`);
    return alert;
};

/**
 * Delete alert by ID
 */
export const deleteAlert = async (id) => {
    const alert = await Alert.findByIdAndDelete(id);
    if (!alert) {
        throw new Error('Alert not found');
    }
    logDb('DELETE', 'Alert', `${alert.title}`);
    return alert;
};

/**
 * Get form data for alert creation/editing (permissions list)
 */
export const getAlertFormData = async () => {
    const permissionList = await Permissions.find();
    return { permissionList };
};
