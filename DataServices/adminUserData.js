import User from '../models/User.js';
import Role from '../models/Role.js';
import bcrypt from 'bcrypt';
import { logDb } from '../logger.js';

/**
 * Get all users with populated role information
 */
export async function getAllUsersWithRoles() {
    return await User.find().populate('role', 'roleName');
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
    return await User.findById(userId);
}

/**
 * Get form data for user creation/editing
 */
export async function getUserFormData() {
    const roles = await Role.find();
    return { roles };
}

/**
 * Update user with password handling
 * If password is empty, keeps the old password
 * If password is provided, hashes it before saving
 */
export async function updateUser(userId, updateData) {
    const processedData = { ...updateData };
    
    // Handle password logic
    if (updateData.password === '') {
        const existingUser = await User.findById(userId);
        processedData.password = existingUser.password;
    } else {
        processedData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    const user = await User.findByIdAndUpdate(userId, processedData, { runValidators: true });
    logDb('UPDATE', 'User', `${processedData.username}`);
    return user;
}

/**
 * Inactivate a user (soft delete)
 */
export async function inactivateUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    
    user.active = false;
    await User.findByIdAndUpdate(userId, user, { runValidators: true });
    logDb('UPDATE', 'User', `${user.username}`);
    
    return user;
}
