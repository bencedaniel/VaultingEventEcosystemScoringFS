import express from 'express';

import {logger} from '../logger.js';
import { Login } from "../controllers/auth.js";
import { Logout } from "../controllers/auth.js";
import Validate from "../middleware/Validate.js";
import { check } from "express-validator";
import { CheckLoggedIn, UserIDValidator, Verify, VerifyRole, StoreUserWithoutValidation, VerifyNoerror } from "../middleware/Verify.js";
import { getDashCardsByType } from '../services/dashboardData.js';
import {
    getUserById,
    updateUserProfile,
    getUserProfileFormData
} from '../services/userData.js';

const router = express.Router();


router.get("/", async (req, res) => {
    res.redirect("/dashboard");

});
router.dashboard = router.get("/dashboard", VerifyNoerror, Verify, async (req, res) => {
    try {
        const cardsFromDB = await getDashCardsByType('user');
        res.render("dashboard", {
            userrole: req.user.role,
            cardsFromDB,
            successMessage: req.session.successMessage,
            rolePermissons: req.user.role.permissions,
            failMessage: req.session.failMessage,
            formData: req.session.formData,
            user: req.user
        });
        req.session.successMessage = null;
        req.session.failMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user?.username);
        req.session.failMessage = err.message || 'Server error';
        res.render("dashboard", {
            userrole: req.user.role,
            cardsFromDB: [],
            successMessage: null,
            rolePermissons: req.user.role.permissions,
            failMessage: req.session.failMessage,
            formData: req.session.formData,
            user: req.user
        });
        req.session.failMessage = null;
    }
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

router.get("/profile/:id", Verify, UserIDValidator, async (req, res) => {
    try {
        const user = await getUserById(req.params.id);
        const { roleList } = await getUserProfileFormData();
        res.render("selfEdit", {
            formID: req.params.id,
            formData: user,
            roleList,
            rolePermissons: req.user?.role.permissions,
            user: req.user,
            successMessage: req.session.successMessage,
            failMessage: req.session.failMessage
        });
        req.session.successMessage = null;
        req.session.failMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = err.message || 'Server error';
        return res.redirect('/dashboard');
    }
});

router.post("/profile/:id", Verify, UserIDValidator, async (req, res) => {
    try {
        await updateUserProfile(req.params.id, req.body);
        logger.db(`User ${req.user.username} updated their profile.`);
        req.session.successMessage = 'Profile updated successfully!';
        res.redirect(`/profile/${req.params.id}`);
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        
        if (err.errors || err.code === 11000) {
            const errorMessage = err.errors
                ? Object.values(err.errors).map(error => error.message).join(' ')
                : 'Az adatok már megtalálhatóak az adatbázisban!';
            
            const { roleList } = await getUserProfileFormData();
            return res.render('selfEdit', {
                formID: req.params.id,
                formData: req.body,
                roleList,
                successMessage: null,
                failMessage: errorMessage,
                rolePermissons: req.user?.role.permissions,
                user: req.user
            });
        }
        
        res.status(500).send('Server Error');
    }
});
router.get('/creators', StoreUserWithoutValidation, async (req, res) => {
    res.render('creators', {
        
        successMessage: req.session?.successMessage, 
        rolePermissons: req.user?.role.permissions,
        failMessage: req.session?.failMessage,
        formData: req.session?.formData,
        user: req?.user
    });
});
router.get('/logout', Logout);



export default router;