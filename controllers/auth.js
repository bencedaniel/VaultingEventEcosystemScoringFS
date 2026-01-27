import User from "../models/User.js";
import bcrypt from "bcrypt";
import Blacklist  from "../models/Blacklist.js";
import { SECURE_MODE } from "../app.js";
import {logger} from "../logger.js"
/**
 * @route POST v1/auth/register
 * @desc Registers a user
 * @access Public
 */
export async function Register(req, res) {
    // get required variables from request body
    // using es6 object destructing
    logger.userManagement("Registering user: "+ JSON.stringify(req.body) );
    const { username, fullname, password,feiid, role } = req.body;

    try {
        // create an instance of a user
        const newUser = new User({
            username,
            fullname,
            password,
            feiid,
            role
            
        });
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser){
            logger.userManagement("Existing user: "+ existingUser.username );
            req.session.formData = req.body; // Save form data to session
            req.session.failMessage =
                "User already exists.";
            return res.redirect("/admin/newUser");} // redirect to dashboard if user already exists
        const savedUser = await newUser.save(); // save new user into the database
        req.session.successMessage =
            "User created successfully.";
            res.redirect("/admin/dashboard/users"); // redirect to dashboard
    } catch (err) {
        logger.error(err + JSON.stringify(req.body) + " User: "+ req.user.username);
        let message = "Server error. Please try again later.";

        if(err.code === 11000) {
            message = "Username or FEI ID already exists.";
        }

        if (err.name === "ValidationError") {
            // Get the first validation error message
            message = Object.values(err.errors)[0].message;
        }
        req.session.failMessage = message;
        
        return res.redirect("/admin/newUser");
    }
    res.end();
}


/**
 * @route POST v1/auth/login
 * @desc logs in a user
 * @access Public
 */
export async function Login(req, res) {
    // Get variables for the login process
    const { username } = req.body;
    try {
        // Check if user exists
        const user = await User.findOne({ username }).select("+password");
        if (!user){
            req.session.failMessage = "User not found";
            return res.redirect("/login");
        }
        logger.userManagement("User: "+ user.username);

        // if user exists
        // validate password
        const isPasswordValid = await bcrypt.compare(
            `${req.body.password}`,
            user.password
        );
        // if not valid, return unathorized response
        if (!isPasswordValid)
        {
            req.session.failMessage = "Invalid username or password";
            return res.redirect("/login");
        }

        let options = {
            maxAge: 20 * 60 * 1000, // would expire in 20minutes
            httpOnly: true, // The cookie is only accessible by the web server
            secure: SECURE_MODE === 'true',
            sameSite: "None",
        };

        const token = user.generateAccessJWT(); // generate session token for user
        res.cookie("token", token, options); // set the token to response header, so that the client sends it back on each subsequent request
        return res.redirect("/dashboard"); // redirect to dashboard
    } catch (err) {
        res.status(500).json({
            status: "error",
            code: 500,
            data: [],
            message: "Internal Server Error at Login: "+ err,
        });
    }
    res.end();
}


/**
 * @route POST /auth/logout
 * @desc Logout user
 * @access Public
 */
export async function Logout(req, res) {
  try {
    const authHeader = req.headers['cookie']; // get the session cookie from request header
    if (!authHeader) return res.sendStatus(204); // No content
    const cookie = authHeader.split('=')[1]; // If there is, split the cookie string to get the actual jwt token
    const accessToken = cookie.split(';')[0];
    const checkIfBlacklisted = await Blacklist.findOne({ token: accessToken }); // Check if that token is blacklisted
    // if true, send a no content response.
    if (checkIfBlacklisted) return res.sendStatus(204);
    // otherwise blacklist token
    const newBlacklist = new Blacklist({
      token: accessToken,
    });
    await newBlacklist.save();
    // Also clear request cookie on client
    res.setHeader('Clear-Site-Data', '"cookies"');
    return res.redirect('/login'); // redirect to home page
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error'+ err,
    });
  }
  res.end();
}