import Category from '../models/Category.js';
import { logDb } from '../logger.js';

/**
 * Get all categories sorted by name
 */
export const getAllCategories = async () => {
    return await Category.find().sort({ name: 1 });
};

/**
 * Get all categories sorted by star rating
 */
export const getAllCategoriesByStar = async () => {
    return await Category.find().sort({ Star: 1 });
};

/**
 * Get category by ID
 */
export const getCategoryById = async (id) => {
    const category = await Category.findById(id);
    if (!category) {
        throw new Error('Category not found');
    }
    return category;
};

/**
 * Create new category
 */
export const createCategory = async (data) => {
    const newCategory = new Category(data);
    await newCategory.save();
    logDb('CREATE', 'Category', `${newCategory.CategoryDispName}`);
    return newCategory;
};

/**
 * Update category by ID
 * Uses delete and recreate strategy to handle schema validation
 */
export const updateCategory = async (id, data) => {
    const oldCategory = await Category.findById(id);
    if (!oldCategory) {
        throw new Error('Category not found');
    }

    // Delete old category
    await Category.findByIdAndDelete(id);
    
    // Create new category with updated data
    const updateData = { ...data, _id: id };
    const updated = new Category(updateData);
    await updated.save();
    logDb('UPDATE', 'Category', `${updated.CategoryDispName}`);
    
    return updated;
};

/**
 * Delete category by ID
 */
export const deleteCategory = async (id) => {
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
        throw new Error('Category not found');
    }
    logDb('DELETE', 'Category', `${category.CategoryDispName}`);
    return category;
};

/**
 * Get form data for category creation/editing
 */
export const getCategoryFormData = async () => {
    return {};
};
