import { logger } from '../logger.js';
import DashCards from '../models/DashCards.js';
import User from '../models/User.js';
import Permissions from '../models/Permissions.js';
import Role from '../models/Role.js';

/**
 * Get admin dashboard data with statistics
 */
export async function getAdminDashboardData() {
    try {
        const [cards, userCount, permissionCount, roleCount] = await Promise.all([
            DashCards.find({ dashtype: 'admin' }).sort({ priority: 1 }),
            User.countDocuments(),
            Permissions.countDocuments(),
            Role.countDocuments()
        ]);

        return {
            cards,
            userCount,
            permissionCount,
            roleCount
        };
    } catch (err) {
        logger.error('Error fetching admin dashboard data: ' + err);
        throw err;
    }
}

/**
 * Get all users for admin dashboard
 */
export async function getAllUsers() {
    try {
        return await User.find();
    } catch (err) {
        logger.error('Error fetching all users: ' + err);
        throw err;
    }
}

/**
 * Get all permissions for admin dashboard
 */
export async function getAllPermissions() {
    try {
        return await Permissions.find();
    } catch (err) {
        logger.error('Error fetching all permissions: ' + err);
        throw err;
    }
}
