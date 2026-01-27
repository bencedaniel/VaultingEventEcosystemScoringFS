import { logger } from '../logger.js';
import {
    getUserById,
    updateUserProfile,
    getUserProfileFormData
} from '../services/userData.js';

/**
 * @route GET /profile/:id
 * @desc Show user profile edit form
 */
async function getProfileEditForm(req, res) {
    try {
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
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = err.message || 'Server error';
        return res.redirect('/dashboard');
    }
};

/**
 * @route POST /profile/:id
 * @desc Update user profile
 */
async function updateProfile(req, res) {
    try {
        await updateUserProfile(req.params.id, req.body);
        logger.db(`User ${req.user.username} updated their profile.`);
        req.session.successMessage = 'Profile updated successfully!';
        res.redirect(`/profile/${req.params.id}`);
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        
        if (err.errors || err.code === 11000) {
            const errorMessage = err.errors
                ? Object.values(err.errors).map(error => error.message).join(' ')
                : 'Datas already exists.';
            
            const { roleList } = await getUserProfileFormData();
            return res.render('selfEdit', {
                formID: req.params.id,
                formData: req.body,
                roleList,
                successMessage: null,
                failMessage: errorMessage,
                rolePermissons: req.user?.role.permissions,
                user: req.user
            });
        }
        
        res.status(500).send('Server Error');
    }
};

export default {
    getProfileEditForm,
    updateProfile
};
