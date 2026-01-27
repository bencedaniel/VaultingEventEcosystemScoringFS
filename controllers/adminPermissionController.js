import { logger } from '../logger.js';
import {
    getAllPermissions,
    getPermissionById,
    getAllPermissionsWithUsageCounts,
    createPermission,
    updatePermission,
    deletePermission
} from '../services/adminPermissionData.js';

/**
 * @route GET /admin/dashboard/permissions
 * @desc Show permissions dashboard with usage counts
 */
export const getPermissionsDashboard = async (req, res) => {
    try {
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
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        res.status(500).send('Server Error');
    }
};

/**
 * @route GET /admin/newPermission
 * @desc Show new permission form
 */
export const getNewPermissionForm = (req, res) => {
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
};

/**
 * @route POST /admin/newPermission
 * @desc Create new permission
 */
export const createNewPermissionHandler = async (req, res) => {
    try {
        const newPermission = await createPermission(req.body);
        logger.db(`Permission ${newPermission.name} created by user ${req.user.username}.`);
        req.session.successMessage = 'Permission created successfully.';
        res.redirect('/admin/dashboard/permissions');
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        req.session.failMessage = errorMessage;
        return res.render("admin/newPerm", {
            rolePermissons: req.user.role.permissions,
            failMessage: req.session.failMessage,
            formData: req.session.formData,
            successMessage: req.session.successMessage,
            user: req.user
        });
    }
};

/**
 * @route GET /admin/editPermission/:id
 * @desc Show edit permission form
 */
export const getEditPermissionForm = async (req, res) => {
    try {
        const permission = await getPermissionById(req.params.id);
        if (!permission) {
            req.session.failMessage = 'Permission not found.';
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
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        res.status(500).send('Server Error');
    }
};

/**
 * @route POST /admin/editPermission/:id
 * @desc Update permission
 */
export const updatePermissionHandler = async (req, res) => {
    try {
        const updatedPermission = await updatePermission(req.params.id, req.body);
        if (!updatedPermission) {
            req.session.failMessage = 'Permission not found.';
            return res.redirect('/admin/dashboard/permissions');
        }
        logger.db(`Permission ${updatedPermission.name} updated by user ${req.user.username}.`);
        req.session.successMessage = 'Permission updated successfully.';
        res.redirect('/admin/dashboard/permissions');
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        req.session.failMessage = errorMessage;
        return res.render('admin/editPerm', {
            rolePermissons: req.user.role.permissions,
            failMessage: req.session.failMessage,
            formData: await getPermissionById(req.params.id),
            successMessage: req.session.successMessage,
            user: req.user
        });
    }
};

/**
 * @route DELETE /admin/deletePermission/:permId
 * @desc Delete permission
 */
export const deletePermissionHandler = async (req, res) => {
    try {
        const permId = req.params.permId;
        const permission = await deletePermission(permId);
        logger.db(`Permission ${permission.name} deleted by user ${req.user.username}.`);
        req.session.successMessage = 'Permission successfully deleted.';
        res.status(200).send('Permission deleted.');
    } catch (err) {
        logger.error("Err:" + err.toString());
        if (err.message === 'Permission not found') {
            req.session.failMessage = 'Permission not found.';
            return res.status(404).send('Permission not found.');
        }
        if (err.message.includes('Cannot delete permission')) {
            req.session.failMessage = err.message;
            return res.status(400).send(err.message);
        }
        res.status(500).send('Server Error');
    }
};
