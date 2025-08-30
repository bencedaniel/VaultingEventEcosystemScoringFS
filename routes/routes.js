import express from 'express';

import {logger, dblogger} from "../logger.js";
import { Login } from "../controllers/auth.js";
import { Logout } from "../controllers/auth.js";
import Validate from "../middleware/Validate.js";
import { check } from "express-validator";
import { CheckLoggedIn, UserIDValidator, Verify, VerifyRole } from "../middleware/Verify.js";
import DashCards from '../models/DashCards.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import bcrypt from 'bcrypt';

const router = express.Router();


router.get("/", async (req, res) => {
    res.redirect("/dashboard");

});
router.dashboard = router.get("/dashboard", Verify, async (req, res) => {
    req.session.successMessage = null; // Üzenet törlése a session-ből  
    req.session.failMessage = null; // Üzenet törlése a session-ből
    res.render("dashboard", {userrole: req.user.role, 
        cardsFromDB: await DashCards.find({ dashtype: 'user' }).sort({ priority: 1 }),
        successMessage: req.session.successMessage, 
        rolePermissons: req.user.role.permissions,
        failMessage: req.session.failMessage,
        formData: req.session.formData,
        user: req.user
    });
});


router.post(
    "/login",
    check("username")
        .not()
        .isEmpty()
        .withMessage("Enter a valid email address"),
    check("password").not().isEmpty(),
    Validate, 
    Login
);
router.get("/login", CheckLoggedIn,(req, res) => {
    const failMessage = req.session.failMessage; // Üzenet beállítása a session-ből
    res.render("login", { failMessage, rolePermissons: req.user?.role.permissions, successMessage: req.session.successMessage});
        req.session.failMessage = null; // Üzenet törlése a session-ből
        req.session.successMessage = null; // Üzenet törlése a session-ből
});

router.get("/profile/:id" , Verify, UserIDValidator, async (req, res) => {
        const roles = await Role.find();
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).render("errorpage", { errorCode: 404, failMessage: "User not found" });
    }
    res.render("selfEdit", { formData:user,roleList: roles, rolePermissons: req.user?.role.permissions,
        user: req.user,
         successMessage: req.session.successMessage,
         failMessage: req.session.failMessage });
    req.session.successMessage = null; // Üzenet törlése a session-ből
    req.session.failMessage = null; // Üzenet törlése a session-ből

});

router.post("/profile/:id", Verify, UserIDValidator, async (req, res) => {
 try {
        const updateData = { ...req.body };
        if (req.body.password=== '') {
            const user = await User.findById(req.params.id);
            updateData.password = user.password;
        }else{
            updateData.password = await bcrypt.hash(req.body.password, 10);
        }
        await User.findByIdAndUpdate(req.params.id, updateData, { runValidators: true });
        dblogger.db(`User ${req.user.username} updated their profile.`);
        req.session.successMessage = 'Profile updated successfully!';
        res.redirect(`/profile/${req.params.id}`);
    } catch (err) {
        console.error(err);
        if (err.errors || err.code === 11000) {

            const errorMessage = err.errors
                ? Object.values(err.errors).map(error => error.message).join(' ')
                : 'Ez a User már létezik!';
            return res.render('selfEdit', {
                formData: req.body,
                successMessage: null,
                failMessage: errorMessage,
                user: req.user
            });
            
        }
        logger.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/logout', Logout);



export default router;