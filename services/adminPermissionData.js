import { logger } from '../logger.js';
import Permissions from '../models/Permissions.js';
import Role from '../models/Role.js';
import DashCards from '../models/DashCards.js';
import Alert from '../models/Alert.js';

/**
 * Get all permissions
 */
export async function getAllPermissions() {
    try {
        return await Permissions.find();
    } catch (err) {
        logger.error('Error fetching permissions: ' + err);
        throw err;
    }
}

/**
 * Get permission by ID
 */
export async function getPermissionById(permId) {
    try {
        return await Permissions.findById(permId);
    } catch (err) {
        logger.error('Error fetching permission by ID: ' + err);
        throw err;
    }
}

/**
 * Get all permissions with usage counts
 */
export async function getAllPermissionsWithUsageCounts() {
    try {
        const permissions = await Permissions.find();
        const RolePermNumList = [];
        
        for (const perm of permissions) {
            RolePermNumList.push({
                permID: perm._id,
                Rolecount: await Role.countDocuments({ permissions: perm.name }),
                Cardcount: await DashCards.countDocuments({ perm: perm.name }),
                Alertcount: await Alert.countDocuments({ permission: perm.name })
            });
        }
        
        return { permissions, RolePermNumList };
    } catch (err) {
        logger.error('Error fetching permissions with usage counts: ' + err);
        throw err;
    }
}

/**
 * Create a new permission
 */
export async function createPermission(permData) {
    try {
        const { name, displayName, attachedURL, requestType } = permData;
        const newPermission = new Permissions({
            name,
            displayName,
            attachedURL,
            requestType
        });
        await newPermission.save();
        return newPermission;
    } catch (err) {
        logger.error('Error creating permission: ' + err);
        throw err;
    }
}

/**
 * Update permission
 */
export async function updatePermission(permId, permData) {
    try {
        const { displayName, attachedURL } = permData;
        
        const updatedPermission = await Permissions.findByIdAndUpdate(permId, {
            displayName: displayName,
            attachedURL: attachedURL
        }, { runValidators: true });
        
        return updatedPermission;
    } catch (err) {
        logger.error('Error updating permission: ' + err);
        throw err;
    }
}

/**
 * Delete permission (with validation that it's not used anywhere)
 */
export async function deletePermission(permId) {
    try {
        const permission = await Permissions.findById(permId);
        if (!permission) {
            throw new Error('Permission not found');
        }
        
        // Check if permission is assigned to any dashboard cards
        const CardCount = await DashCards.countDocuments({ requiredPermissions: permission.name });
        if (CardCount > 0) {
            throw new Error('Cannot delete permission. It is assigned to one or more dashboard cards.');
        }
        
        // Check if permission is assigned to any alerts
        const alertCount = await Alert.countDocuments({ requiredPermissions: permission.name });
        if (alertCount > 0) {
            throw new Error('Cannot delete permission. It is assigned to one or more alerts.');
        }
        
        // Check if permission is assigned to any roles
        const roleCount = await Role.countDocuments({ permissions: permission.name });
        if (roleCount > 0) {
            throw new Error('Cannot delete permission. It is assigned to one or more roles.');
        }
        
        await Permissions.findByIdAndDelete(permId);
        return permission;
    } catch (err) {
        logger.error('Error deleting permission: ' + err);
        throw err;
    }
}
