import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
import {
    getAllRoles,
    getRoleById,
    getAllRolesWithUserCounts,
    getRoleFormData,
    createRole,
    updateRole,
    deleteRole
} from '../DataServices/adminRoleData.js';

/**
 * @route GET /admin/dashboard/roles
 * @desc Show roles dashboard with user counts
 */
const getRolesDashboard = asyncHandler(async (req, res) => {
    const { roles, RoleNumList } = await getAllRolesWithUserCounts();
    res.render("admin/roledash", {
        rolenumlist: RoleNumList,
        rolePermissons: req.user.role.permissions,
        roles: roles,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route GET /admin/newRole
 * @desc Show new role form
 */
const getNewRoleForm = asyncHandler(async (req, res) => {
    const { permissions } = await getRoleFormData();
    res.render("admin/newRole", {
        permissions: permissions,
        rolePermissons: req.user.role.permissions,
        failMessage: req.session.failMessage,
        formData: req.session.formData,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.formData = null;
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /admin/newRole
 * @desc Create new role
 */
const createNewRoleHandler = asyncHandler(async (req, res) => {
    const newRole = await createRole(req.body);
    logOperation('ROLE_CREATE', `Role created: ${newRole.roleName}`, req.user.username, HTTP_STATUS.CREATED);
    req.session.successMessage = MESSAGES.SUCCESS.ROLE_CREATED;
    res.redirect('/admin/dashboard/roles');
});

/**
 * @route GET /admin/editRole/:id
 * @desc Show edit role form
 */
const getEditRoleForm = asyncHandler(async (req, res) => {
    const role = await getRoleById(req.params.id);
    if (!role) {
        req.session.failMessage = MESSAGES.ERROR.ROLE_NOT_FOUND;
        return res.redirect('/admin/dashboard/roles');
    }
    const { permissions } = await getRoleFormData();
    res.render('admin/editRole', {
        permissions: permissions,
        rolePermissons: req.user.role.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        formData: role,
        user: req.user
    });
    req.session.successMessage = null;
    req.session.failMessage = null;
});

/**
 * @route POST /admin/editRole/:id
 * @desc Update role
 */
const updateRoleHandler = asyncHandler(async (req, res) => {
    const updatedRole = await updateRole(req.params.id, req.body);
    logOperation('ROLE_UPDATE', `Role updated: ${req.body.roleName}`, req.user.username, HTTP_STATUS.OK);
    if (!updatedRole) {
        req.session.failMessage = MESSAGES.ERROR.ROLE_NOT_FOUND;
        return res.redirect('/admin/dashboard/roles');
    }
    req.session.successMessage = MESSAGES.SUCCESS.ROLE_UPDATED;
    res.redirect('/admin/dashboard/roles');
});

/**
 * @route DELETE /admin/deleteRole/:roleId
 * @desc Delete role
 */
const deleteRoleHandler = asyncHandler(async (req, res) => {
    const roleId = req.params.roleId;
    const role = await deleteRole(roleId);
    logOperation('ROLE_DELETE', `Role deleted: ${role.roleName}`, req.user.username, HTTP_STATUS.OK);
    req.session.successMessage = MESSAGES.SUCCESS.ROLE_DELETED;
    res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.ROLE_DELETE_RESPONSE);
});

export default {
    getRolesDashboard,
    getNewRoleForm,
    createNewRoleHandler,
    getEditRoleForm,
    updateRoleHandler,
    deleteRoleHandler
};
