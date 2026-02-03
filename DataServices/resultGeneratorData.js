import resultGenerator from '../models/resultGenerator.js';
import Category from '../models/Category.js';
import calcTemplate from '../models/calcTemplate.js';
import { logDb } from '../logger.js';

/**
 * Retrieves all result generators with populated category and calculation schema template
 * @returns {Promise<Array>} Array of all result generators
 */
export async function getAllGenerators() {
    return await resultGenerator.find().populate('category').populate('calcSchemaTemplate');
}

/**
 * Retrieves a single result generator by ID
 * @param {string} id - Generator ID
 * @returns {Promise<Object>} Generator document
 */
export async function getGeneratorById(id) {
    return await resultGenerator.findById(id).populate('category').populate('calcSchemaTemplate');
}

/**
 * Gathers form data needed for generator create/edit forms
 * @returns {Promise<Object>} Object containing categories and calcTemplates arrays
 */
export async function getGeneratorFormData() {
    const categories = await Category.find();
    const calcTemplates = await calcTemplate.find();
    return { categories, calcTemplates };
}

/**
 * Creates a new result generator with validation
 * Ensures only one generator per category exists
 * @param {Object} data - Generator data (category, calcSchemaTemplate, active)
 * @returns {Promise<Object>} Created generator document
 * @throws {Error} If generator for category already exists
 */
export async function createGenerator(data) {
    const existingGenerator = await resultGenerator.findOne({ category: data.category });
    if (existingGenerator) {
        throw new Error("A result generator for the selected category already exists.");
    }

    const newGenerator = new resultGenerator(data);
    await newGenerator.save();
    logDb('CREATE', 'ResultGenerator', `${newGenerator._id}`);
    return newGenerator;
}

/**
 * Updates an existing result generator with validation
 * Ensures category uniqueness (other than the current generator)
 * @param {string} id - Generator ID
 * @param {Object} data - Updated generator data
 * @returns {Promise<Object>} Updated generator document
 * @throws {Error} If another generator with same category exists
 */
export async function updateGenerator(id, data) {
    const existingGenerator = await resultGenerator.findOne({ category: data.category, _id: { $ne: id } });
    if (existingGenerator) {
        throw new Error("A result generator for the selected category already exists.");
    }
    const updated = await resultGenerator.findByIdAndUpdate(id, data, { new: true });
    logDb('UPDATE', 'ResultGenerator', `${id}`);
    return updated;
}

/**
 * Updates the active status of a result generator
 * @param {string} id - Generator ID
 * @param {boolean} status - Active status
 * @returns {Promise<Object>} Updated generator document
 * @throws {Error} If generator not found
 */
export async function updateGeneratorStatus(id, status) {
    const generator = await resultGenerator.findById(id);
    if (!generator) {
        throw new Error("Result generator not found.");
    }
    generator.active = status;
    await generator.save();
    logDb('UPDATE', 'ResultGenerator', `${id}`);
    return generator;
}

/**
 * Deletes a result generator by ID
 * @param {string} id - Generator ID
 * @returns {Promise<Object>} Deleted generator document
 */
export async function deleteGenerator(id) {
    await resultGenerator.findByIdAndDelete(id);
    logDb('DELETE', 'ResultGenerator', `${id}`);
}
