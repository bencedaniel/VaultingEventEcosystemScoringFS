import { logger } from '../logger.js';
import { getAdminDashboardData } from '../services/adminDashboardData.js';

/**
 * @route GET /admin/dashboard
 * @desc Show admin dashboard with statistics
 */
async function getAdminDashboard(req, res) {
    try {
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
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = 'Server error';
        return res.redirect('/dashboard');
    }
};

export default {
    getAdminDashboard
};
