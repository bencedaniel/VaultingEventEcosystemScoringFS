import calcTemplate from '../models/calcTemplate.js';
import resultGenerator from '../models/resultGenerator.js';
import resultGroup from '../models/resultGroup.js';
import Category from '../models/Category.js';

/**
 * Get all calculation templates
 */
export const getAllCalcTemplates = async () => {
    return await calcTemplate.find();
};

/**
 * Get calculation template by ID
 */
export const getCalcTemplateById = async (id) => {
    return await calcTemplate.findById(id);
};

/**
 * Create new calculation template
 */
export const createCalcTemplate = async (data) => {
    const calcTemp = new calcTemplate(data);
    await calcTemp.save();
    logDb('CREATE', 'CalcTemplate', `${calcTemp._id}`);
    return calcTemp;
};

/**
 * Update calculation template by ID
 */
export const updateCalcTemplate = async (id, data) => {
    const calcTemp = await calcTemplate.findByIdAndUpdate(id, data, { new: true });
    logDb('UPDATE', 'CalcTemplate', `${id}`);
    return calcTemp;
};

/**
 * Delete calculation template by ID
 * Checks if it's in use before deleting
 */
export const deleteCalcTemplate = async (id) => {
    // Check if template is in use
    const inUseByGroup = await resultGroup.findOne({ calcTemplate: id });
    const inUseByGenerator = await resultGenerator.findOne({ calcSchemaTemplate: id });
    
    if (inUseByGroup || inUseByGenerator) {
        throw new Error("Cannot delete calculation template as it is in use by a result group or generator.");
    }
    
    await calcTemplate.findByIdAndDelete(id);
    logDb('DELETE', 'CalcTemplate', `${id}`);
};

/**
 * Get form data for calculation template (categories)
 */
export const getCalcTemplateFormData = async () => {
    const categories = await Category.find();
    return { categories };
};
