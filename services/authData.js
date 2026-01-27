import User from '../models/User.js';
import Blacklist from '../models/Blacklist.js';
import bcrypt from 'bcrypt';
import { logger } from '../logger.js';

/**
 * Find user by username
 */
export async function findUserByUsername(username) {
    return await User.findOne({ username });
}

/**
 * Find user by username with password
 */
export async function findUserByUsernameWithPassword(username) {
    return await User.findOne({ username }).select("+password");
}

/**
 * Create new user
 */
export async function createUser(userData) {
    const { username, fullname, password, feiid, role } = userData;
    
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        throw new Error('User already exists');
    }
    
    const newUser = new User({
        username,
        fullname,
        password,
        feiid,
        role
    });
    
    await newUser.save();
    logger.userManagement(`User ${newUser.username} registered successfully.`);
    return newUser;
}

/**
 * Validate user password
 */
export async function validateUserPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Check if token is blacklisted
 */
export async function isTokenBlacklisted(token) {
    const blacklistedToken = await Blacklist.findOne({ token });
    return !!blacklistedToken;
}

/**
 * Blacklist a token
 */
export async function blacklistToken(token) {
    const newBlacklist = new Blacklist({ token });
    await newBlacklist.save();
    logger.userManagement(`Token blacklisted successfully.`);
    return newBlacklist;
}
