import Entries from '../models/Entries.js';
import Vaulter from '../models/Vaulter.js';
import Lunger from '../models/Lunger.js';
import Horse from '../models/Horse.js';
import Category from '../models/Category.js';
import Event from '../models/Event.js';
import TimetablePart from '../models/Timetablepart.js';

/**
 * Get all vaulters
 */
export async function getAllVaulters() {
    return await Vaulter.find();
}

/**
 * Get all lungers
 */
export async function getAllLungers() {
    return await Lunger.find();
}

/**
 * Get all horses
 */
export async function getAllHorses() {
    return await Horse.find();
}

/**
 * Get all categories sorted by Star
 */
export async function getAllCategories() {
    return await Category.find().sort({ Star: 1 });
}

/**
 * Get all events
 */
export async function getAllEvents() {
    return await Event.find();
}

/**
 * Create a new entry
 */
export async function createEntry(data) {
    const newEntry = new Entries(data);
    await newEntry.save();
    return newEntry;
}

/**
 * Get entries by event ID with full population
 */
export async function getEntriesByEvent(eventId) {
    return await Entries.find({ event: eventId })
        .populate('vaulter')
        .populate('horse')
        .populate('lunger')
        .populate('category')
        .sort({ name: 1 });
}

/**
 * Get entry by ID with full population
 */
export async function getEntryByIdWithPopulation(id) {
    const entry = await Entries.findById(id)
        .populate('vaulter')
        .populate('horse')
        .populate('lunger')
        .populate('category')
        .populate('event');
    if (!entry) {
        throw new Error('Entry not found');
    }
    return entry;
}

/**
 * Update entry using delete-create pattern and clean up timetable parts
 * This complex operation handles entry updates by recreating the entry
 * and removing it from timetable parts if status changes
 */
export async function updateEntry(id, updateData, eventId) {
    // Delete old entry
    const entry = await Entries.findByIdAndDelete(id);
    if (!entry) {
        throw new Error('Entry not found');
    }
    
    // Create new entry with updated data
    const updated = new Entries(updateData);
    await updated.save();
    
    // If status is not confirmed, remove from timetable parts
    if (updated.status !== 'confirmed') {
        const timetableParts = await TimetablePart.find({
            event: eventId,
            Category: updated.category
        });
        
        for (const tp of timetableParts) {
            const originalLength = tp.StartingOrder.length;
            tp.StartingOrder = tp.StartingOrder.filter(
                item => item.Entry.toString() !== updated._id.toString()
            );
            
            // Only save if something was removed
            if (tp.StartingOrder.length !== originalLength) {
                await tp.save();
            }
        }
    }
    
    return { oldEntry: entry, newEntry: updated };
}

/**
 * Delete an incident from entry
 */
export async function deleteEntryIncident(id, incidentData) {
    const entry = await Entries.findById(id);
    if (!entry) {
        throw new Error('Entry not found');
    }
    
    entry.EntryIncident = entry.EntryIncident.filter(incident =>
        !(
            incident.description === incidentData.description &&
            incident.incidentType === incidentData.type
        )
    );
    
    await Entries.findByIdAndUpdate(id, entry, { runValidators: true });
    return entry;
}

/**
 * Add an incident to entry
 */
export async function addEntryIncident(id, incidentData) {
    const entry = await Entries.findById(id);
    if (!entry) {
        throw new Error('Entry not found');
    }
    
    const newIncident = {
        description: incidentData.description,
        incidentType: incidentData.incidentType,
        date: Date.now(),
        User: incidentData.userId
    };
    
    entry.EntryIncident.push(newIncident);
    await Entries.findByIdAndUpdate(id, entry, { runValidators: true });
    return entry;
}

/**
 * Get horses for event from entries
 */
export async function getHorsesForEvent(eventId) {
    const horsesontheEvent = await Entries.find({ event: eventId })
        .populate('horse')
        .select('horse');
    
    if (horsesontheEvent.length === 0) {
        throw new Error('No entries found for the selected event');
    }
    
    const uniqueHorses = Array.from(new Set(horsesontheEvent.map(entry => entry.horse._id.toString())));
    const horses = await Horse.find({ _id: { $in: uniqueHorses } }).sort({ name: 1 });
    return horses;
}

/**
 * Update horse vet check status
 */
export async function updateHorseVetStatus(horseId, statusData) {
    const horse = await Horse.findById(horseId);
    if (!horse) {
        throw new Error('Horse not found');
    }
    
    horse.VetCheckStatus.push({
        status: statusData.status,
        date: Date.now(),
        user: statusData.userId,
        eventID: statusData.eventId
    });
    
    await Horse.findByIdAndUpdate(horseId, horse, { runValidators: true });
    return horse;
}

/**
 * Get selected event
 */
export async function getSelectedEvent() {
    const selectedEvent = await Event.findOne({ selected: true });
    if (!selectedEvent) {
        throw new Error('No event selected');
    }
    return selectedEvent;
}
