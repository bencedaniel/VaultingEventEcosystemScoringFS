import { logger } from '../logger.js';
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} from '../services/categoryData.js';

/**
 * @route GET /category/new
 * @desc Show new category form
 */
async function getNewCategoryForm(req, res) {
    res.render('category/newCategory', {
        formData: req.session.formData,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
};

/**
 * @route POST /category/new
 * @desc Create new category
 */
async function createNewCategoryHandler(req, res) {
    try {
        const newCategory = await createCategory(req.body);
        logger.db(`Category ${newCategory.name} created by user ${req.user.username}.`);
        req.session.successMessage = 'Category created successfully!';
        res.redirect('/category/dashboard');
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : (err.message || 'Server error');
        return res.render('category/newCategory', {
            formData: req.body,
            successMessage: null,
            failMessage: errorMessage,
            rolePermissons: req.user?.role?.permissions,
            user: req.user
        });
    }
};

/**
 * @route GET /category/dashboard
 * @desc Show categories dashboard
 */
async function getCategoriesDashboard(req, res) {
    try {
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
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = err.message || 'Server error';
        return res.redirect('/dashboard');
    }
};

/**
 * @route GET /category/edit/:id
 * @desc Show edit category form
 */
async function getEditCategoryForm(req, res) {
    try {
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
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = err.message || 'Server error';
        return res.redirect('/category/dashboard');
    }
};

/**
 * @route POST /category/edit/:id
 * @desc Update category
 */
async function updateCategoryHandler(req, res) {
    try {
        const updated = await updateCategory(req.params.id, req.body);
        logger.db(`Category ${updated.CategoryDispName} updated by user ${req.user.username}.`);
        req.session.successMessage = 'Category updated successfully!';
        res.redirect('/category/dashboard');
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : (err.message || 'Server error');
        return res.render('category/editCategory', {
            formData: { ...req.body, _id: req.params.id },
            successMessage: null,
            failMessage: errorMessage,
            rolePermissons: req.user?.role?.permissions,
            user: req.user
        });
    }
};

/**
 * @route DELETE /category/delete/:id
 * @desc Delete category
 * @note Currently commented out in original code - can be implemented if needed
 */
async function deleteCategoryHandler(req, res) {
    try {
        const category = await deleteCategory(req.params.id);
        logger.db(`Category ${category.name} deleted by user ${req.user.username}.`);
        if (!category) {
            req.session.failMessage = 'Category not found';
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = 'Server error';
        res.status(500).json({ message: 'Server error' });
    }
};

export default {
    getNewCategoryForm,
    createNewCategoryHandler,
    getCategoriesDashboard,
    getEditCategoryForm,
    updateCategoryHandler,
    deleteCategoryHandler
};
