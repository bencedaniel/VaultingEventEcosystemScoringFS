import Role from '../models/Role.js';
import User from '../models/User.js';
import Permissions from '../models/Permissions.js';
import { logDb } from '../logger.js';

/**
 * Get all roles
 */
export async function getAllRoles() {
    return await Role.find();
}

/**
 * Get role by ID
 */
export async function getRoleById(roleId) {
    return await Role.findById(roleId);
}

/**
 * Get all roles with user counts
 */
export async function getAllRolesWithUserCounts() {
    const roles = await Role.find();
    const RoleNumList = [];
    
    for (const role of roles) {
        const CountUsersbyRoleId = await User.countDocuments({ role: role._id });
        RoleNumList.push({ roleID: role._id, count: CountUsersbyRoleId });
    }
    
    return { roles, RoleNumList };
}

/**
 * Get form data for role creation/editing
 */
export async function getRoleFormData() {
    const permissions = await Permissions.find();
    return { permissions };
}

/**
 * Create a new role
 */
export async function createRole(roleData) {
    const { roleName, description, permissions } = roleData;
    const newRole = new Role({
        roleName,
        description,
        permissions
    });
    await newRole.save();
    logDb('CREATE', 'Role', `${roleName}`);
    return newRole;
}

/**
 * Update role
 */
export async function updateRole(roleId, roleData) {
    const { roleName, description, permissions } = roleData;
    
    const updatedRole = await Role.findByIdAndUpdate(roleId, {
        roleName,
        description,
        permissions
    }, { runValidators: true });
    logDb('UPDATE', 'Role', `${roleName}`);
    
    return updatedRole;
}

/**
 * Delete role (with validation that it's not assigned to any user)
 */
export async function deleteRole(roleId) {
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
    logDb('DELETE', 'Role', `${role.roleName}`);
    return role;
}
