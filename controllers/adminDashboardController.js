import { logger } from '../logger.js';
import Role from "../models/Role.js";
import User from "../models/User.js";
import Permissions from '../models/Permissions.js';
import DashCards from '../models/DashCards.js';

/**
 * @route GET /admin/dashboard
 * @desc Show admin dashboard with statistics
 */
export const getAdminDashboard = async (req, res) => {
    const rolePermissons = req.user.role.permissions;
    res.render("admin/admindash", {
        cardsFromDB: await DashCards.find({ dashtype: 'admin' }).sort({ priority: 1 }),
        userCount: await User.countDocuments(),
        permissionCount: await Permissions.countDocuments(),
        roleCount: await Role.countDocuments(),
        rolePermissons: rolePermissons,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
};
