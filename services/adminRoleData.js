import { logger } from '../logger.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import Permissions from '../models/Permissions.js';

/**
 * Get all roles
 */
export async function getAllRoles() {
    try {
        return await Role.find();
    } catch (err) {
        logger.error('Error fetching roles: ' + err);
        throw err;
    }
}

/**
 * Get role by ID
 */
export async function getRoleById(roleId) {
    try {
        return await Role.findById(roleId);
    } catch (err) {
        logger.error('Error fetching role by ID: ' + err);
        throw err;
    }
}

/**
 * Get all roles with user counts
 */
export async function getAllRolesWithUserCounts() {
    try {
        const roles = await Role.find();
        const RoleNumList = [];
        
        for (const role of roles) {
            const CountUsersbyRoleId = await User.countDocuments({ role: role._id });
            RoleNumList.push({ roleID: role._id, count: CountUsersbyRoleId });
        }
        
        return { roles, RoleNumList };
    } catch (err) {
        logger.error('Error fetching roles with user counts: ' + err);
        throw err;
    }
}

/**
 * Get form data for role creation/editing
 */
export async function getRoleFormData() {
    try {
        const permissions = await Permissions.find();
        return { permissions };
    } catch (err) {
        logger.error('Error fetching role form data: ' + err);
        throw err;
    }
}

/**
 * Create a new role
 */
export async function createRole(roleData) {
    try {
        const { roleName, description, permissions } = roleData;
        const newRole = new Role({
            roleName,
            description,
            permissions
        });
        await newRole.save();
        return newRole;
    } catch (err) {
        logger.error('Error creating role: ' + err);
        throw err;
    }
}

/**
 * Update role
 */
export async function updateRole(roleId, roleData) {
    try {
        const { roleName, description, permissions } = roleData;
        
        const updatedRole = await Role.findByIdAndUpdate(roleId, {
            roleName,
            description,
            permissions
        }, { runValidators: true });
        
        return updatedRole;
    } catch (err) {
        logger.error('Error updating role: ' + err);
        throw err;
    }
}

/**
 * Delete role (with validation that it's not assigned to any user)
 */
export async function deleteRole(roleId) {
    try {
        const role = await Role.findById(roleId);
        if (!role) {
            throw new Error('Role not found');
        }

        // Check if the role is assigned to any user
        const userCount = await User.countDocuments({ role: roleId });
        if (userCount > 0) {
            throw new Error('Cannot delete role. It is assigned to one or more users.');
        }

        await Role.findByIdAndDelete(roleId);
        return role;
    } catch (err) {
        logger.error('Error deleting role: ' + err);
        throw err;
    }
}
