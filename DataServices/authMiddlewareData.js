import Blacklist from '../models/Blacklist.js';
import User from '../models/User.js';
import RoleModel from '../models/Role.js';
import PermissionModel from '../models/Permissions.js';
import { logger } from '../logger.js';
import { logDb } from '../logger.js';

/**
 * Check if token is blacklisted
 */
export async function isTokenBlacklisted(token) {
    return await Blacklist.findOne({ token });
}

/**
 * Blacklist a token
 */
export async function blacklistToken(token) {
    const newBlacklist = new Blacklist({ token });
    await newBlacklist.save();
    logger.userManagement(`Token blacklisted successfully.`);
    logDb('CREATE', 'Blacklist', `${newBlacklist._id}`);
    return newBlacklist;
}

/**
 * Find user by ID with populated role
 */
export async function findUserByIdWithRole(userId) {
    return await User.findById(userId).populate("role");
}

/**
 * Get role with permissions by role ID
 */
export async function getRoleWithPermissions(roleId) {
    const role = await RoleModel.findById(roleId);
    if (!role) return null;
    
    const permissions = await PermissionModel.find({
        name: { $in: role.permissions }
    });
    
    return { role, permissions };
}
