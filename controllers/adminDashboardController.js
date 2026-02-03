import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getAdminDashboardData } from '../DataServices/adminDashboardData.js';

/**
 * @route GET /admin/dashboard
 * @desc Show admin dashboard with statistics
 */
const getAdminDashboard = asyncHandler(async (req, res) => {
    const { cards, userCount, permissionCount, roleCount } = await getAdminDashboardData();
    const rolePermissons = req.user.role.permissions;
    res.render("admin/admindash", {
        cardsFromDB: cards,
        userCount,
        permissionCount,
        roleCount,
        rolePermissons: rolePermissons,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

export default {
    getAdminDashboard
};
