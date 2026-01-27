import express from 'express';
import { Verify, VerifyRole } from "../middleware/Verify.js";
import { Register } from "../controllers/auth.js";
import Validate from "../middleware/Validate.js";
import * as adminUserController from '../controllers/adminUserController.js';
import * as adminRoleController from '../controllers/adminRoleController.js';
import * as adminPermissionController from '../controllers/adminPermissionController.js';
import * as adminCardController from '../controllers/adminCardController.js';
import * as adminDashboardController from '../controllers/adminDashboardController.js';

const adminRouter = express.Router();

// ===========================
// ADMIN DASHBOARD
// ===========================

adminRouter.get("/dashboard", Verify, VerifyRole(), adminDashboardController.getAdminDashboard);

// ===========================
// USER MANAGEMENT
// ===========================

adminRouter.get("/newUser", Verify, VerifyRole(), adminUserController.getNewUserForm);
adminRouter.post("/newUser", Verify, VerifyRole(), Validate, Register);
adminRouter.get("/dashboard/users", Verify, VerifyRole(), adminUserController.getUsersDashboard);
adminRouter.get('/editUser/:id', Verify, VerifyRole(), adminUserController.getEditUserForm);
adminRouter.post('/editUser/:id', Verify, VerifyRole(), adminUserController.updateUserHandler);
adminRouter.delete('/deleteUser/:userId', Verify, VerifyRole(), adminUserController.deleteUserHandler);

// ===========================
// ROLE MANAGEMENT
// ===========================

adminRouter.get("/dashboard/roles", Verify, VerifyRole(), adminRoleController.getRolesDashboard);
adminRouter.get("/newRole", Verify, VerifyRole(), adminRoleController.getNewRoleForm);
adminRouter.post("/newRole", Verify, VerifyRole(), adminRoleController.createNewRoleHandler);
adminRouter.get('/editRole/:id', Verify, VerifyRole(), adminRoleController.getEditRoleForm);
adminRouter.post('/editRole/:id', Verify, VerifyRole(), adminRoleController.updateRoleHandler);
adminRouter.delete('/deleteRole/:roleId', Verify, VerifyRole(), adminRoleController.deleteRoleHandler);

// ===========================
// PERMISSION MANAGEMENT
// ===========================

adminRouter.get("/dashboard/permissions", Verify, VerifyRole(), adminPermissionController.getPermissionsDashboard);
adminRouter.get("/newPermission", Verify, VerifyRole(), adminPermissionController.getNewPermissionForm);
adminRouter.post("/newPermission", Verify, VerifyRole(), adminPermissionController.createNewPermissionHandler);
adminRouter.get('/editPermission/:id', Verify, VerifyRole(), adminPermissionController.getEditPermissionForm);
adminRouter.post('/editPermission/:id', Verify, VerifyRole(), adminPermissionController.updatePermissionHandler);
adminRouter.delete('/deletePermission/:permId', Verify, VerifyRole(), adminPermissionController.deletePermissionHandler);

// ===========================
// CARD DASHBOARD MANAGEMENT
// ===========================

adminRouter.get("/newCard", Verify, VerifyRole(), adminCardController.getNewCardForm);
adminRouter.get("/dashboard/cards", Verify, VerifyRole(), adminCardController.getCardsDashboard);
adminRouter.get('/editCard/:id', Verify, VerifyRole(), adminCardController.getEditCardForm);
adminRouter.post('/newCard', Verify, VerifyRole(), adminCardController.createNewCardHandler);
adminRouter.post('/editCard/:id', Verify, VerifyRole(), adminCardController.updateCardHandler);
adminRouter.delete('/deleteCard/:cardId', Verify, VerifyRole(), adminCardController.deleteCardHandler);

export default adminRouter;
