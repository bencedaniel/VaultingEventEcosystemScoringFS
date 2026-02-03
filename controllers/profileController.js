import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
import {
    getUserById,
    updateUserProfile,
    getUserProfileFormData
} from '../DataServices/userData.js';

/**
 * @route GET /profile/:id
 * @desc Show user profile edit form
 */
const getProfileEditForm = asyncHandler(async (req, res) => {
    const user = await getUserById(req.params.id);
    const { roleList } = await getUserProfileFormData();
    res.render("selfEdit", {
        formID: req.params.id,
        formData: user,
        roleList,
        rolePermissons: req.user?.role.permissions,
        user: req.user,
        successMessage: req.session.successMessage,
        failMessage: req.session.failMessage
    });
    req.session.successMessage = null;
    req.session.failMessage = null;
});

/**
 * @route POST /profile/:id
 * @desc Update user profile
 */
const updateProfile = asyncHandler(async (req, res) => {
    await updateUserProfile(req.params.id, req.body);
    logOperation('USER_UPDATE', `User updated: ${req.user.username}`, req.user.username, HTTP_STATUS.OK);
    req.session.successMessage = MESSAGES.SUCCESS.PROFILE_UPDATED;
    res.redirect(`/profile/${req.params.id}`);
});

export default {
    getProfileEditForm,
    updateProfile
};
