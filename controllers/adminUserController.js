import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
import {
    getAllUsersWithRoles,
    getUserById,
    getUserFormData,
    updateUser,
    inactivateUser
} from '../DataServices/adminUserData.js';
import User from "../models/User.js";

/**
 * @route GET /admin/newUser
 * @desc Show new user form
 */
const getNewUserForm = asyncHandler(async (req, res) => {
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
});

/**
 * @route POST /admin/newUser
 * @desc Create new user (handled by Validate middleware and Register controller from auth)
 * @note This is called from auth.js Register function via middleware chain
 */
const createNewUser = asyncHandler(async (req, res) => {
    // Note: User creation is handled by auth.js Register() function
    // This export is for route definition purposes
});

/**
 * @route GET /admin/dashboard/users
 * @desc Show users dashboard
 */
const getUsersDashboard = asyncHandler(async (req, res) => {
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
});

/**
 * @route GET /admin/editUser/:id
 * @desc Show edit user form
 */
const getEditUserForm = asyncHandler(async (req, res) => {
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
});

/**
 * @route POST /admin/editUser/:id
 * @desc Update user
 */
const updateUserHandler = asyncHandler(async (req, res) => {
    await updateUser(req.params.id, req.body);
    logOperation('USER_UPDATE', `User updated: ${req.body.username}`, req.user.username, HTTP_STATUS.OK);
    req.session.successMessage = MESSAGES.SUCCESS.USER_MODIFIED;
    res.redirect('/admin/dashboard/users');
});

/**
 * @route DELETE /admin/deleteUser/:userId
 * @desc Inactivate user
 */
const deleteUserHandler = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    await inactivateUser(userId);
    logOperation('USER_DELETE', `User deleted: ${userId}`, req.user.username, HTTP_STATUS.OK);
    req.session.successMessage = MESSAGES.SUCCESS.USER_INACTIVATED;
    res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.USER_DELETE_RESPONSE);
});

export default {
    getNewUserForm,
    createNewUser,
    getUsersDashboard,
    getEditUserForm,
    updateUserHandler,
    deleteUserHandler
};
