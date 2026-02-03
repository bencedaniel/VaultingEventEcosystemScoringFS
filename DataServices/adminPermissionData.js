import Permissions from '../models/Permissions.js';
import Role from '../models/Role.js';
import DashCards from '../models/DashCards.js';
import Alert from '../models/Alert.js';
import { logDb } from '../logger.js';

/**
 * Get all permissions
 */
export async function getAllPermissions() {
    return await Permissions.find();
}

/**
 * Get permission by ID
 */
export async function getPermissionById(permId) {
    return await Permissions.findById(permId);
}

/**
 * Get all permissions with usage counts
 */
export async function getAllPermissionsWithUsageCounts() {
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
}

/**
 * Create a new permission
 */
export async function createPermission(permData) {
    const { name, displayName, attachedURL, requestType } = permData;
    const newPermission = new Permissions({
        name,
        displayName,
        attachedURL,
        requestType
    });
    await newPermission.save();
    logDb('CREATE', 'Permission', `${name}`);
    return newPermission;
}

/**
 * Update permission
 */
export async function updatePermission(permId, permData) {
    const { displayName, attachedURL } = permData;
    
    const updatedPermission = await Permissions.findByIdAndUpdate(permId, {
        displayName: displayName,
        attachedURL: attachedURL
    }, { runValidators: true });
    logDb('UPDATE', 'Permission', `${updatedPermission.name}`);
    
    return updatedPermission;
}

/**
 * Delete permission (with validation that it's not used anywhere)
 */
export async function deletePermission(permId) {
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
    logDb('DELETE', 'Permission', `${permission.name}`);
    return permission;
}
