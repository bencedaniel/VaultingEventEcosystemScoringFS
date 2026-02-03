import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getDashCardsByType } from '../DataServices/dashboardData.js';

/**
 * @route GET /dashboard
 * @desc Show user dashboard
 */
const getDashboard = asyncHandler(async (req, res) => {
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
});

export default {
    getDashboard
};
