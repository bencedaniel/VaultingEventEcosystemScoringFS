import Lunger from '../models/Lunger.js';
import Permissions from '../models/Permissions.js';
import User from '../models/User.js';

/**
 * Retrieves all lungers sorted by name
 * @returns {Promise<Array>} Array of lungers
 */
export async function getAllLungers() {
    const lungers = await Lunger.find().sort({ name: 1 });
    return lungers;
}

/**
 * Retrieves a lunger by ID
 * @param {string} id - Lunger ID
 * @returns {Promise<Object>} Lunger document
 * @throws {Error} If lunger not found
 */
export async function getLungerById(id) {
    const lunger = await Lunger.findById(id);
    if (!lunger) {
        throw new Error("Lunger not found");
    }
    return lunger;
}

/**
 * Retrieves a lunger by ID with populated incident event details
 * @param {string} id - Lunger ID
 * @returns {Promise<Object>} Lunger document with populated incidents
 * @throws {Error} If lunger not found
 */
export async function getLungerByIdWithPopulation(id) {
    const lunger = await Lunger.findById(id).populate('LungerIncident.eventID', 'EventName');
    if (!lunger) {
        throw new Error("Lunger not found");
    }
    return lunger;
}

/**
 * Creates a new lunger
 * @param {Object} data - Lunger data
 * @returns {Promise<Object>} Created lunger document
 */
export async function createLunger(data) {
    const newLunger = new Lunger(data);
    await newLunger.save();
    return newLunger;
}

/**
 * Updates a lunger by ID
 * @param {string} id - Lunger ID
 * @param {Object} data - Updated lunger data
 * @returns {Promise<Object>} Updated lunger document
 * @throws {Error} If lunger not found
 */
export async function updateLunger(id, data) {
    const lunger = await Lunger.findByIdAndUpdate(id, data, { runValidators: true });
    if (!lunger) {
        throw new Error("Lunger not found");
    }
    return lunger;
}

/**
 * Deletes an incident from a lunger
 * @param {string} id - Lunger ID
 * @param {Object} incidentData - Incident data with description and type
 * @returns {Promise<Object>} Updated lunger document
 * @throws {Error} If lunger not found
 */
export async function deleteLungerIncident(id, incidentData) {
    const lunger = await Lunger.findById(id);
    if (!lunger) {
        throw new Error("Lunger not found");
    }

    lunger.LungerIncident = lunger.LungerIncident.filter(incident =>
        !(
            incident.description === incidentData.description &&
            incident.incidentType === incidentData.type
        )
    );

    await Lunger.findByIdAndUpdate(id, lunger, { runValidators: true });
    return lunger;
}

/**
 * Adds an incident to a lunger
 * @param {string} id - Lunger ID
 * @param {Object} incidentData - Incident data
 * @returns {Promise<Object>} Updated lunger document
 * @throws {Error} If lunger not found
 */
export async function addLungerIncident(id, incidentData) {
    const lunger = await Lunger.findById(id);
    if (!lunger) {
        throw new Error("Lunger not found");
    }

    const newIncident = {
        description: incidentData.description,
        incidentType: incidentData.incidentType,
        date: Date.now(),
        User: incidentData.userId,
        eventID: incidentData.eventId
    };

    lunger.LungerIncident.push(newIncident);
    await Lunger.findByIdAndUpdate(id, lunger, { runValidators: true });
    return lunger;
}

/**
 * Retrieves all users for form data
 * @returns {Promise<Array>} Array of users
 */
export async function getAllUsers() {
    const users = await User.find();
    return users;
}

/**
 * Retrieves all permissions for form data
 * @returns {Promise<Array>} Array of permissions
 */
export async function getAllPermissions() {
    const permissions = await Permissions.find();
    return permissions;
}
