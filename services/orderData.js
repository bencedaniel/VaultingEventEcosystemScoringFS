import TimetablePart from '../models/Timetablepart.js';
import Entries from '../models/Entries.js';

/**
 * Retrieves a timetable part by ID with populated daily timetable
 * @param {string} id - Timetable part ID
 * @returns {Promise<Object>} Timetable part document
 * @throws {Error} If timetable part not found
 */
export async function getTimetablePartById(id) {
    const timetablePart = await TimetablePart.findById(id).populate('dailytimetable').exec();
    if (!timetablePart) {
        throw new Error("Timetable part not found.");
    }
    return timetablePart;
}

/**
 * Retrieves entries for given categories with filtering
 * @param {string} eventId - Event ID
 * @param {Array} categories - Category IDs
 * @param {string} status - Entry status (default: 'confirmed')
 * @returns {Promise<Array>} Entries with populated vaulter, horse, lunger
 */
export async function getEntriesForCategories(eventId, categories, status = 'confirmed') {
    const entries = await Entries.find({ 
        event: eventId, 
        status: status, 
        category: { $in: categories } 
    })
        .populate('vaulter horse lunger')
        .exec();
    return entries;
}

/**
 * Validates and filters starting order to only include valid entries
 * @param {Object} timetablePart - Timetable part with StartingOrder
 * @param {Array} validEntryIds - Array of valid entry IDs
 * @returns {Promise<Object>} Updated timetable part
 */
export async function validateAndFilterStartingOrder(timetablePart, validEntryIds) {
    const validSet = new Set(validEntryIds.map(e => e.toString()));
    timetablePart.StartingOrder = timetablePart.StartingOrder.filter(so => 
        validSet.has(so.Entry.toString())
    );
    await timetablePart.save();
    return timetablePart;
}

/**
 * Updates starting order for a timetable part
 * @param {string} id - Timetable part ID
 * @param {Object} orderData - { entryId, newOrder }
 * @returns {Promise<Object>} Updated timetable part
 */
export async function updateStartingOrder(id, orderData) {
    const timetablePart = await TimetablePart.findById(id);
    if (!timetablePart) {
        throw new Error("Timetable part not found.");
    }

    let changed = false;
    let oldOrder = "";

    // Remove the entry from current position
    timetablePart.StartingOrder = timetablePart.StartingOrder.filter(
        so => String(so.Entry) !== String(orderData.entryId)
    );

    // Find if order number already exists
    for (let i = 0; i < timetablePart.StartingOrder.length; i++) {
        if (timetablePart.StartingOrder[i].Order == orderData.newOrder) {
            oldOrder = timetablePart.StartingOrder[i].Entry;
            timetablePart.StartingOrder[i].Entry = orderData.entryId;
            changed = true;
            break;
        }
    }

    // Remove old entry if it was replaced
    timetablePart.StartingOrder = timetablePart.StartingOrder.filter(
        so => String(so.Entry) !== String(oldOrder)
    );

    // Add entry to new position if not changed (means order number was free)
    if (!changed) {
        timetablePart.StartingOrder.push({ 
            Entry: orderData.entryId, 
            Order: orderData.newOrder 
        });
    }

    await timetablePart.save();
    return timetablePart;
}

/**
 * Generates a new unique order number for an entry
 * @param {Object} timetablePart - Timetable part with StartingOrder
 * @param {number} entriesCount - Total number of entries
 * @param {number} currentOrderNr - Current order number to exclude
 * @returns {Promise<number>} New unique order number
 * @throws {Error} If cannot generate after 50 attempts
 */
export async function generateNewOrderNumber(timetablePart, entriesCount, currentOrderNr) {
    const usedNumbers = new Set(timetablePart.StartingOrder.map(so => so.Order));

    let attempts = 50;
    let randomnumber;

    do {
        randomnumber = Math.floor(Math.random() * entriesCount) + 1;
        if (attempts-- < 0) {
            throw new Error("Could not generate a new order number, please try again.");
        }
    } while (usedNumbers.has(randomnumber) || String(randomnumber) === String(currentOrderNr));

    return randomnumber;
}

/**
 * Updates order number for a specific entry in starting order
 * @param {string} id - Timetable part ID
 * @param {string} entryId - Entry ID
 * @param {number} newOrder - New order number
 * @returns {Promise<Object>} Updated timetable part
 */
export async function updateEntryOrderNumber(id, entryId, newOrder) {
    const timetablePart = await TimetablePart.findById(id);
    if (!timetablePart) {
        throw new Error("Timetable part not found.");
    }

    for (let i = 0; i < timetablePart.StartingOrder.length; i++) {
        if (timetablePart.StartingOrder[i].Entry == entryId) {
            timetablePart.StartingOrder[i].Order = newOrder;
            break;
        }
    }

    await timetablePart.save();
    return timetablePart;
}

/**
 * Checks for conflicts (same horse or lunger) and generates starting order for conflicted entries
 * @param {Object} timetablePart - Timetable part
 * @param {Array} entries - All entries for this category
 * @returns {Promise<Object>} Object with timetablePart, conflictedEntries
 */
export async function checkAndGenerateConflictingOrders(timetablePart, entries) {
    const conflictedEntries = [];
    const usedNumbers = new Set(
        timetablePart.StartingOrder.map(so => so.Order)
    );

    for (let i = 0; i < entries.length; i++) {
        let hasConflict = false;

        // Check for conflicts with other entries
        for (let j = 0; j < entries.length; j++) {
            if (i !== j) {
                if (String(entries[i].horse) === String(entries[j].horse) || 
                    String(entries[i].lunger) === String(entries[j].lunger)) {
                    hasConflict = true;
                    break;
                }
            }
        }

        if (hasConflict) {
            conflictedEntries.push(entries[i]);

            // Check if entry already has order assigned
            const isGenerated = timetablePart.StartingOrder.some(
                so => String(so.Entry) === String(entries[i]._id)
            );

            if (!isGenerated) {
                let randomnumber;
                do {
                    randomnumber = Math.floor(Math.random() * entries.length) + 1;
                } while (usedNumbers.has(randomnumber));

                usedNumbers.add(randomnumber);
                timetablePart.StartingOrder.push({ 
                    Entry: entries[i]._id, 
                    Order: randomnumber 
                });
            }
        }
    }

    await timetablePart.save();
    return { timetablePart, conflictedEntries };
}

/**
 * Generates complete starting order for all entries
 * @param {Object} timetablePart - Timetable part
 * @param {Array} entries - All entries for this category
 * @returns {Promise<Object>} Updated timetable part with complete StartingOrder
 */
export async function generateCompleteStartingOrder(timetablePart, entries) {
    const usedEntryIds = new Set(
        timetablePart.StartingOrder.map(so => String(so.Entry))
    );
    const usedNumbers = new Set(
        timetablePart.StartingOrder.map(so => so.Order)
    );

    // Add missing entries with random order numbers
    for (let i = 0; i < entries.length; i++) {
        if (!usedEntryIds.has(String(entries[i]._id))) {
            let randomnumber;
            do {
                randomnumber = Math.floor(Math.random() * entries.length) + 1;
            } while (usedNumbers.has(randomnumber));

            usedNumbers.add(randomnumber);
            timetablePart.StartingOrder.push({ 
                Entry: entries[i]._id, 
                Order: randomnumber 
            });
        }
    }

    timetablePart.drawingDone = true;
    await timetablePart.save();
    return timetablePart;
}

/**
 * Updates timetable part status fields
 * @param {string} id - Timetable part ID
 * @param {Object} data - Fields to update (conflictsChecked, drawingDone, creationMethod)
 * @returns {Promise<Object>} Updated timetable part
 */
export async function updateTimetablePartStatus(id, data) {
    const timetablePart = await TimetablePart.findById(id);
    if (!timetablePart) {
        throw new Error("Timetable part not found.");
    }

    Object.assign(timetablePart, data);
    await timetablePart.save();
    return timetablePart;
}

/**
 * Helper to parse categories from timetable part
 * Ensures categories is always an array
 * @param {Object|Array} category - Category field from timetable part
 * @returns {Array} Categories array
 */
export function parseCategoriesArray(category) {
    if (Array.isArray(category)) {
        return category;
    }
    return category ? [category] : [];
}
