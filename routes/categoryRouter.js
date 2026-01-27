import express from 'express';
import { Verify, VerifyRole } from "../middleware/Verify.js";
import Validate from "../middleware/Validate.js";
import * as categoryController from '../controllers/categoryController.js';

const categoryRouter = express.Router();

// ===========================
// CATEGORY MANAGEMENT
// ===========================

categoryRouter.get('/new', Verify, VerifyRole(), categoryController.getNewCategoryForm);
categoryRouter.post('/new', Verify, VerifyRole(), categoryController.createNewCategoryHandler);
categoryRouter.get('/dashboard', Verify, VerifyRole(), categoryController.getCategoriesDashboard);
categoryRouter.get('/edit/:id', Verify, VerifyRole(), categoryController.getEditCategoryForm);
categoryRouter.post('/edit/:id', Verify, VerifyRole(), Validate, categoryController.updateCategoryHandler);

// categoryRouter.delete('/delete/:id', Verify, VerifyRole(), categoryController.deleteCategoryHandler);

export default categoryRouter;