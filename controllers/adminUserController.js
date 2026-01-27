import { logger } from '../logger.js';
import {
    getAllUsersWithRoles,
    getUserById,
    getUserFormData,
    updateUser,
    inactivateUser
} from '../services/adminUserData.js';
import User from "../models/User.js";

/**
 * @route GET /admin/newUser
 * @desc Show new user form
 */
async function getNewUserForm(req, res) {
    try {
        const { roles } = await getUserFormData();
        const userrole = req.user?.role.permissions;
        res.render("admin/newUser", {
            rolePermissons: userrole,
            failMessage: req.session.failMessage,
            formData: req.session.formData,
            roleList: roles,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.successMessage = null;
        req.session.formData = null;
        req.session.failMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = 'Error loading user form';
        res.redirect('/admin/dashboard');
    }
};

/**
 * @route POST /admin/newUser
 * @desc Create new user (handled by Validate middleware and Register controller from auth)
 * @note This is called from auth.js Register function via middleware chain
 */
async function createNewUser(req, res) {
    // Note: User creation is handled by auth.js Register() function
    // This export is for route definition purposes
};

/**
 * @route GET /admin/dashboard/users
 * @desc Show users dashboard
 */
async function getUsersDashboard(req, res) {
    try {
        const users = await getAllUsersWithRoles();
        const rolePermissons = req.user.role.permissions;

        res.render("admin/userdash", {
            rolePermissons: rolePermissons,
            users: users,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null;
        req.session.successMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = 'Error loading users';
        res.redirect('/admin/dashboard');
    }
};

/**
 * @route GET /admin/editUser/:id
 * @desc Show edit user form
 */
async function getEditUserForm(req, res) {
    try {
        const user = await getUserById(req.params.id);
        const { roles } = await getUserFormData();
        res.render('admin/editUser', {
            failMessage: req.session.failMessage, 
            formData: user,
            userrole: req.user.role,
            roleList: roles,
            rolePermissons: req.user.role.permissions,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null;
        req.session.successMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        res.status(500).send('Server Error');
    }
};

/**
 * @route POST /admin/editUser/:id
 * @desc Update user
 */
async function updateUserHandler(req, res) {
    try {
        await updateUser(req.params.id, req.body);
        logger.db(`User ${req.body.username} updated by user ${req.user.username}.`);
        req.session.successMessage = 'User modified successfully!';
        res.redirect('/admin/dashboard/users');
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        if (err.errors || err.code === 11000) {
            const { roles } = await getUserFormData();
            const errorMessage = err.errors
                ? Object.values(err.errors).map(error => error.message).join(' ')
                : 'Ez a User már létezik!';
            return res.render('admin/editUser', {
                roleList: roles,
                formData: req.body,
                successMessage: null,
                failMessage: errorMessage,
                rolePermissons: req.user.role.permissions,
                user: req.user
            });
        }
        logger.error(err + " User: " + req.user.username);
        res.status(500).send('Server Error');
    }
};

/**
 * @route DELETE /admin/deleteUser/:userId
 * @desc Inactivate user
 */
async function deleteUserHandler(req, res) {
    try {
        const userId = req.params.userId;
        await inactivateUser(userId);
        logger.db(`User ${userId} inactivated by user ${req.user.username}.`);
        req.session.successMessage = 'User successfully inactivated.';
        res.status(200).send('User deleted.');
    } catch (err) {
        logger.error("Err:" + err.toString());
        res.status(500).send('Server Error');
    }
};

export default {
    getNewUserForm,
    createNewUser,
    getUsersDashboard,
    getEditUserForm,
    updateUserHandler,
    deleteUserHandler
};
