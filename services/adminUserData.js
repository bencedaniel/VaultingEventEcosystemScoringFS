import { logger } from '../logger.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import bcrypt from 'bcrypt';

/**
 * Get all users with populated role information
 */
export async function getAllUsersWithRoles() {
    try {
        return await User.find().populate('role', 'roleName');
    } catch (err) {
        logger.error('Error fetching users with roles: ' + err);
        throw err;
    }
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
    try {
        return await User.findById(userId);
    } catch (err) {
        logger.error('Error fetching user by ID: ' + err);
        throw err;
    }
}

/**
 * Get form data for user creation/editing
 */
export async function getUserFormData() {
    try {
        const roles = await Role.find();
        return { roles };
    } catch (err) {
        logger.error('Error fetching user form data: ' + err);
        throw err;
    }
}

/**
 * Update user with password handling
 * If password is empty, keeps the old password
 * If password is provided, hashes it before saving
 */
export async function updateUser(userId, updateData) {
    try {
        const processedData = { ...updateData };
        
        // Handle password logic
        if (updateData.password === '') {
            const existingUser = await User.findById(userId);
            processedData.password = existingUser.password;
        } else {
            processedData.password = await bcrypt.hash(updateData.password, 10);
        }
        
        return await User.findByIdAndUpdate(userId, processedData, { runValidators: true });
    } catch (err) {
        logger.error('Error updating user: ' + err);
        throw err;
    }
}

/**
 * Inactivate a user (soft delete)
 */
export async function inactivateUser(userId) {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        user.active = false;
        await User.findByIdAndUpdate(userId, user, { runValidators: true });
        
        return user;
    } catch (err) {
        logger.error('Error inactivating user: ' + err);
        throw err;
    }
}
