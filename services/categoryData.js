import Category from '../models/Category.js';

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

    try {
        // Delete old category
        await Category.findByIdAndDelete(id);
        
        // Create new category with updated data
        const updateData = { ...data, _id: id };
        const updated = new Category(updateData);
        await updated.save();
        
        return updated;
    } catch (err) {
        // Restore old category on error
        await oldCategory.save();
        throw err;
    }
};

/**
 * Delete category by ID
 */
export const deleteCategory = async (id) => {
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
        throw new Error('Category not found');
    }
    return category;
};

/**
 * Get form data for category creation/editing
 */
export const getCategoryFormData = async () => {
    return {};
};
