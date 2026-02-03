import { SECURE_MODE } from "../app.js";
import { logger, logAuth, logError, logValidation } from "../logger.js";
import { asyncHandler } from '../middleware/asyncHandler.js';
import { JWT_CONFIG, COOKIE_CONFIG, HTTP_STATUS, MESSAGES } from '../config/index.js';
import {
    findUserByUsername,
    findUserByUsernameWithPassword,
    createUser,
    validateUserPassword,
    isTokenBlacklisted,
    blacklistToken
} from '../DataServices/authData.js';

/**
 * @route POST v1/auth/register
 * @desc Registers a user
 * @access Public
 */
const Register = asyncHandler(async (req, res) => {
    const { username, fullname, password, feiid, role } = req.body;
    
    try {
        await createUser({ username, fullname, password, feiid, role });
        logAuth('REGISTER', username, true);
        req.session.successMessage = MESSAGES.SUCCESS.USER_CREATED;
        res.redirect("/admin/dashboard/users");
    } catch (error) {
        logAuth('REGISTER', username, false, `Error: ${error.message}`);
        throw error;
    }
});


/**
 * @route POST v1/auth/login
 * @desc logs in a user
 * @access Public
 */
const Login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    
    const user = await findUserByUsernameWithPassword(username);
    if (!user) {
        logAuth('LOGIN', username, false, 'USER_NOT_FOUND');
        req.session.failMessage = MESSAGES.AUTH.USER_NOT_FOUND;
        return res.redirect("/login");
    }

    const isPasswordValid = await validateUserPassword(password, user.password);
    if (!isPasswordValid) {
        logAuth('LOGIN', username, false, 'INVALID_CREDENTIALS');
        req.session.failMessage = MESSAGES.AUTH.INVALID_CREDENTIALS;
        return res.redirect("/login");
    }

    let options = {
        ...COOKIE_CONFIG.OPTIONS,
        maxAge: JWT_CONFIG.COOKIE_MAX_AGE,
        secure: SECURE_MODE === 'true',
        sameSite: COOKIE_CONFIG.OPTIONS.sameSite || "None"
    };

    const token = user.generateAccessJWT();
    res.cookie(COOKIE_CONFIG.TOKEN_NAME, token, options);
    logAuth('LOGIN', username, true);
    return res.redirect("/dashboard");
});


/**
 * @route POST /auth/logout
 * @desc Logout user
 * @access Public
 */
const Logout = asyncHandler(async (req, res) => {
    const authHeader = req.headers['cookie'];
    if (!authHeader) return res.sendStatus(HTTP_STATUS.NO_CONTENT);
    
    const cookie = authHeader.split('=')[1];
    const accessToken = cookie.split(';')[0];
    const username = req.user?.username || 'unknown';
    
    const checkIfBlacklisted = await isTokenBlacklisted(accessToken);
    if (checkIfBlacklisted) return res.sendStatus(HTTP_STATUS.NO_CONTENT);
    
    await blacklistToken(accessToken);
    logAuth('LOGOUT', username, true);
    
    res.setHeader('Clear-Site-Data', '"cookies"');
    return res.redirect('/login');
});

export default { Register, Login, Logout };