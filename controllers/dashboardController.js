import { logger } from '../logger.js';
import { getDashCardsByType } from '../services/dashboardData.js';

/**
 * @route GET /dashboard
 * @desc Show user dashboard
 */
async function getDashboard(req, res) {
    try {
        const cardsFromDB = await getDashCardsByType('user');
        res.render("dashboard", {
            userrole: req.user.role,
            cardsFromDB,
            successMessage: req.session.successMessage,
            rolePermissons: req.user.role.permissions,
            failMessage: req.session.failMessage,
            formData: req.session.formData,
            user: req.user
        });
        req.session.successMessage = null;
        req.session.failMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user?.username);
        req.session.failMessage = err.message || 'Server error';
        res.render("dashboard", {
            userrole: req.user.role,
            cardsFromDB: [],
            successMessage: null,
            rolePermissons: req.user.role.permissions,
            failMessage: req.session.failMessage,
            formData: req.session.formData,
            user: req.user
        });
        req.session.failMessage = null;
    }
};

export default {
    getDashboard
};
