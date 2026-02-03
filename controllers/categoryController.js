import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} from '../DataServices/categoryData.js';

/**
 * @route GET /category/new
 * @desc Show new category form
 */
const getNewCategoryForm = asyncHandler(async (req, res) => {
    res.render('category/newCategory', {
        formData: req.session.formData,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /category/new
 * @desc Create new category
 */
const createNewCategoryHandler = asyncHandler(async (req, res) => {
    const newCategory = await createCategory(req.body);
    logOperation('CATEGORY_CREATE', `Category created: ${newCategory.name}`, req.user.username, HTTP_STATUS.CREATED);
    req.session.successMessage = MESSAGES.SUCCESS.CATEGORY_CREATED;
    res.redirect('/category/dashboard');
});

/**
 * @route GET /category/dashboard
 * @desc Show categories dashboard
 */
const getCategoriesDashboard = asyncHandler(async (req, res) => {
    const categorys = await getAllCategories();
    res.render('category/categorydash', {
        categorys,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route GET /category/edit/:id
 * @desc Show edit category form
 */
const getEditCategoryForm = asyncHandler(async (req, res) => {
    const category = await getCategoryById(req.params.id);
    res.render('category/editCategory', {
        formData: category,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /category/edit/:id
 * @desc Update category
 */
const updateCategoryHandler = asyncHandler(async (req, res) => {
    const updated = await updateCategory(req.params.id, req.body);
    logOperation('CATEGORY_UPDATE', `Category updated: ${updated.CategoryDispName}`, req.user.username, HTTP_STATUS.OK);
    req.session.successMessage = MESSAGES.SUCCESS.CATEGORY_UPDATED;
    res.redirect('/category/dashboard');
});

/**
 * @route DELETE /category/delete/:id
 * @desc Delete category
 * @note Currently commented out in original code - can be implemented if needed
 */
const deleteCategoryHandler = asyncHandler(async (req, res) => {
    const category = await deleteCategory(req.params.id);
    logOperation('CATEGORY_DELETE', `Category deleted: ${category.name}`, req.user.username, HTTP_STATUS.OK);
    if (!category) {
        req.session.failMessage = MESSAGES.ERROR.CATEGORY_NOT_FOUND;
        return res.status(HTTP_STATUS.NOT_FOUND).json({ message: MESSAGES.ERROR.CATEGORY_NOT_FOUND });
    }
    res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.CATEGORY_DELETED });
});

export default {
    getNewCategoryForm,
    createNewCategoryHandler,
    getCategoriesDashboard,
    getEditCategoryForm,
    updateCategoryHandler,
    deleteCategoryHandler
};
