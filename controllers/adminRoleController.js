import { logger } from '../logger.js';
import {
    getAllRoles,
    getRoleById,
    getAllRolesWithUserCounts,
    getRoleFormData,
    createRole,
    updateRole,
    deleteRole
} from '../services/adminRoleData.js';

/**
 * @route GET /admin/dashboard/roles
 * @desc Show roles dashboard with user counts
 */
export const getRolesDashboard = async (req, res) => {
    try {
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
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        res.status(500).send('Server Error');
    }
};

/**
 * @route GET /admin/newRole
 * @desc Show new role form
 */
export const getNewRoleForm = async (req, res) => {
    try {
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
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = 'Error loading role form';
        res.redirect('/admin/dashboard/roles');
    }
};

/**
 * @route POST /admin/newRole
 * @desc Create new role
 */
export const createNewRoleHandler = async (req, res) => {
    try {
        const newRole = await createRole(req.body);
        logger.db(`Role ${newRole.roleName} created by user ${req.user.username}.`);
        req.session.successMessage = 'Role created successfully.';
        res.redirect('/admin/dashboard/roles');
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        req.session.failMessage = errorMessage;
        const { permissions } = await getRoleFormData();
        return res.render('admin/newRole', {
            permissions: permissions,
            rolePermissons: req.user.role.permissions,
            failMessage: req.session.failMessage,
            formData: req.session.formData,
            successMessage: req.session.successMessage,
            user: req.user
        });
    }
};

/**
 * @route GET /admin/editRole/:id
 * @desc Show edit role form
 */
export const getEditRoleForm = async (req, res) => {
    try {
        const role = await getRoleById(req.params.id);
        if (!role) {
            req.session.failMessage = 'Role not found.';
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
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        res.status(500).send('Server Error');
    }
};

/**
 * @route POST /admin/editRole/:id
 * @desc Update role
 */
export const updateRoleHandler = async (req, res) => {
    try {
        const updatedRole = await updateRole(req.params.id, req.body);
        logger.db(`Role ${req.body.roleName} updated by user ${req.user.username}.`);
        if (!updatedRole) {
            req.session.failMessage = 'Role not found.';
            return res.redirect('/admin/dashboard/roles');
        }
        req.session.successMessage = 'Role updated successfully.';
        res.redirect('/admin/dashboard/roles');
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        req.session.failMessage = errorMessage;
        const { permissions } = await getRoleFormData();
        return res.render('admin/editRole', {
            permissions: permissions,
            rolePermissons: req.user.role.permissions,
            failMessage: req.session.failMessage,
            formData: req.session.formData,
            successMessage: req.session.successMessage,
            user: req.user
        });
    }
};

/**
 * @route DELETE /admin/deleteRole/:roleId
 * @desc Delete role
 */
export const deleteRoleHandler = async (req, res) => {
    try {
        const roleId = req.params.roleId;
        const role = await deleteRole(roleId);
        logger.db(`Role ${role.roleName} deleted by user ${req.user.username}.`);
        req.session.successMessage = 'Role successfully deleted.';
        res.status(200).send('Role deleted.');
    } catch (err) {
        logger.error("Err:" + err.toString());
        if (err.message === 'Role not found') {
            req.session.failMessage = 'Role not found.';
            return res.status(404).send('Role not found.');
        }
        if (err.message.includes('Cannot delete role')) {
            req.session.failMessage = err.message;
            return res.status(400).send(err.message);
        }
        res.status(500).send('Server Error');
    }
};
