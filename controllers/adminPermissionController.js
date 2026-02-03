import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
import {
    getAllPermissions,
    getPermissionById,
    getAllPermissionsWithUsageCounts,
    createPermission,
    updatePermission,
    deletePermission
} from '../DataServices/adminPermissionData.js';

/**
 * @route GET /admin/dashboard/permissions
 * @desc Show permissions dashboard with usage counts
 */
const getPermissionsDashboard = asyncHandler(async (req, res) => {
    const { permissions, RolePermNumList } = await getAllPermissionsWithUsageCounts();
    res.render("admin/permdash", {
        rolepermNumList: RolePermNumList,
        rolePermissons: req.user.role.permissions,
        permissions: permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route GET /admin/newPermission
 * @desc Show new permission form
 */
const getNewPermissionForm = asyncHandler(async (req, res) => {
    res.render("admin/newPerm", {
        rolePermissons: req.user.role.permissions,
        failMessage: req.session.failMessage,
        formData: req.session.formData,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.successMessage = null;
    req.session.formData = null;
    req.session.failMessage = null;
});

/**
 * @route POST /admin/newPermission
 * @desc Create new permission
 */
const createNewPermissionHandler = asyncHandler(async (req, res) => {
    const newPermission = await createPermission(req.body);
    logOperation('PERMISSION_CREATE', `Permission created: ${newPermission.name}`, req.user.username, HTTP_STATUS.CREATED);
    req.session.successMessage = MESSAGES.SUCCESS.PERMISSION_CREATED;
    res.redirect('/admin/dashboard/permissions');
});

/**
 * @route GET /admin/editPermission/:id
 * @desc Show edit permission form
 */
const getEditPermissionForm = asyncHandler(async (req, res) => {
    const permission = await getPermissionById(req.params.id);
    if (!permission) {
        req.session.failMessage = MESSAGES.ERROR.PERMISSION_NOT_FOUND;
        return res.redirect('/admin/dashboard/permissions');
    }
    res.render('admin/editPerm', {
        rolePermissons: req.user.role.permissions,
        failMessage: req.session.failMessage,
        formData: permission,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /admin/editPermission/:id
 * @desc Update permission
 */
const updatePermissionHandler = asyncHandler(async (req, res) => {
    const updatedPermission = await updatePermission(req.params.id, req.body);
    if (!updatedPermission) {
        req.session.failMessage = MESSAGES.ERROR.PERMISSION_NOT_FOUND;
        return res.redirect('/admin/dashboard/permissions');
    }
    logOperation('PERMISSION_UPDATE', `Permission updated: ${updatedPermission.name}`, req.user.username, HTTP_STATUS.OK);
    req.session.successMessage = MESSAGES.SUCCESS.PERMISSION_UPDATED;
    res.redirect('/admin/dashboard/permissions');
});
/**
 * @route DELETE /admin/deletePermission/:permId
 * @desc Delete permission
 */
const deletePermissionHandler = asyncHandler(async (req, res) => {
    const permId = req.params.permId;
    const permission = await deletePermission(permId);
    logOperation('PERMISSION_DELETE', `Permission deleted: ${permission.name}`, req.user.username, HTTP_STATUS.OK);
    req.session.successMessage = MESSAGES.SUCCESS.PERMISSION_DELETED;
    res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.PERMISSION_DELETE_RESPONSE);
});

export default {
    getPermissionsDashboard,
    getNewPermissionForm,
    createNewPermissionHandler,
    getEditPermissionForm,
    updatePermissionHandler,
    deletePermissionHandler
};
