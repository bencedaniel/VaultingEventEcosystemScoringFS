import TableMapping from '../models/TableMapping.js';
import Permissions from '../models/Permissions.js';

/**
 * Retrieves all table mappings sorted by name
 * @returns {Promise<Array>} Array of table mappings
 */
export async function getAllMappings() {
    const mappings = await TableMapping.find().sort({ name: 1 });
    return mappings;
}

/**
 * Retrieves a table mapping by ID
 * @param {string} id - Table mapping ID
 * @returns {Promise<Object>} Table mapping document
 * @throws {Error} If mapping not found
 */
export async function getMappingById(id) {
    const mapping = await TableMapping.findById(id);
    if (!mapping) {
        throw new Error("Mapping not found");
    }
    return mapping;
}

/**
 * Creates a new table mapping
 * @param {Object} data - Table mapping data
 * @returns {Promise<Object>} Created table mapping document
 */
export async function createMapping(data) {
    const newMapping = new TableMapping(data);
    await newMapping.save();
    return newMapping;
}

/**
 * Updates a table mapping by ID
 * @param {string} id - Table mapping ID
 * @param {Object} data - Updated table mapping data
 * @returns {Promise<Object>} Updated table mapping document
 * @throws {Error} If mapping not found
 */
export async function updateMapping(id, data) {
    const mapping = await TableMapping.findByIdAndUpdate(id, data, { runValidators: true });
    if (!mapping) {
        throw new Error("Mapping not found");
    }
    return mapping;
}

/**
 * Deletes a table mapping by ID
 * @param {string} id - Table mapping ID
 * @returns {Promise<Object>} Deleted table mapping document
 * @throws {Error} If mapping not found
 */
export async function deleteMapping(id) {
    const mapping = await TableMapping.findByIdAndDelete(id);
    if (!mapping) {
        throw new Error("Mapping not found");
    }
    return mapping;
}

/**
 * Retrieves all permissions for form data
 * @returns {Promise<Array>} Array of permissions
 */
export async function getAllPermissions() {
    const permissions = await Permissions.find();
    return permissions;
}
