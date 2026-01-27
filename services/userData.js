import User from '../models/User.js';
import Role from '../models/Role.js';
import bcrypt from 'bcrypt';

/**
 * Get user by ID
 */
export const getUserById = async (id) => {
    const user = await User.findById(id);
    if (!user) {
        throw new Error('User not found');
    }
    return user;
};

/**
 * Get user by ID and populate role
 */
export const getUserByIdWithRole = async (id) => {
    const user = await User.findById(id).populate('role');
    if (!user) {
        throw new Error('User not found');
    }
    return user;
};

/**
 * Update user profile (username, feiid, password)
 */
export const updateUserProfile = async (id, data) => {
    const { username, feiid, password } = data;
    const updateData = { username, feiid };
    
    if (!password || password === '') {
        const user = await User.findById(id);
        if (!user) {
            throw new Error('User not found');
        }
        updateData.password = user.password;
    } else {
        updateData.password = await bcrypt.hash(password, 10);
    }
    
    const updatedUser = await User.findByIdAndUpdate(id, updateData, { runValidators: true, new: true });
    if (!updatedUser) {
        throw new Error('User not found');
    }
    return updatedUser;
};

/**
 * Get all roles
 */
export const getAllRoles = async () => {
    return await Role.find();
};

/**
 * Get form data for user profile (roles list)
 */
export const getUserProfileFormData = async () => {
    const roleList = await Role.find();
    return { roleList };
};
