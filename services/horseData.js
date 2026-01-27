import Horse from '../models/Horse.js';
import Permissions from '../models/Permissions.js';
import Entries from '../models/Entries.js';

/**
 * Get all horses sorted by name
 */
export async function getAllHorses() {
    return await Horse.find().sort({ name: 1 });
}

/**
 * Get horse by ID
 */
export async function getHorseById(id) {
    const horse = await Horse.findById(id);
    if (!horse) {
        throw new Error('Horse not found');
    }
    return horse;
}

/**
 * Get horse by ID with full population for details view
 */
export async function getHorseByIdWithPopulation(id) {
    const horse = await Horse.findById(id)
        .populate('Notes.user', '-password -__v')
        .populate('VetCheckStatus.eventID', 'EventName')
        .populate('VetCheckStatus.user', '-password -__v')
        .populate('Notes.eventID', 'EventName');
    if (!horse) {
        throw new Error('Horse not found');
    }
    return horse;
}

/**
 * Create a new horse with HeadNr and BoxNr for event
 */
export async function createHorse(data, headNr, boxNr, eventId) {
    const newHorse = new Horse(data);
    newHorse.HeadNr.push({
        headNumber: headNr,
        eventID: eventId
    });
    newHorse.BoxNr.push({
        boxNumber: boxNr,
        eventID: eventId
    });
    await newHorse.save();
    return newHorse;
}

/**
 * Update horse and manage HeadNr/BoxNr for specific event
 */
export async function updateHorse(id, data, headNr, boxNr, eventId) {
    const horse = await Horse.findByIdAndUpdate(id, data, { runValidators: true });
    if (!horse) {
        throw new Error('Horse not found');
    }
    
    const horseToUpdate = await Horse.findById(id);
    
    // Update BoxNr for the event
    let editedCount = 0;
    horseToUpdate.BoxNr.forEach(b => {
        if (String(b.eventID) === String(eventId)) {
            b.boxNumber = boxNr;
            editedCount++;
        }
    });
    if (editedCount === 0) {
        horseToUpdate.BoxNr.push({
            boxNumber: boxNr,
            eventID: eventId
        });
    }

    // Update HeadNr for the event
    editedCount = 0;
    horseToUpdate.HeadNr.forEach(h => {
        if (String(h.eventID) === String(eventId)) {
            h.headNumber = headNr;
            editedCount++;
        }
    });
    if (editedCount === 0) {
        horseToUpdate.HeadNr.push({
            headNumber: headNr,
            eventID: eventId
        });
    }

    await horseToUpdate.save();
    return horse;
}

/**
 * Delete a note from horse
 */
export async function deleteHorseNote(id, noteText) {
    const horse = await Horse.findById(id);
    if (!horse) {
        throw new Error('Horse not found');
    }
    horse.Notes = horse.Notes.filter(note => note.note !== noteText);
    await Horse.findByIdAndUpdate(id, horse, { runValidators: true });
    return horse;
}

/**
 * Add a note to horse
 */
export async function addHorseNote(id, noteData) {
    const horse = await Horse.findById(id);
    if (!horse) {
        throw new Error('Horse not found');
    }
    const newNote = {
        note: noteData.note,
        timestamp: Date.now(),
        user: noteData.user,
        eventID: noteData.eventID
    };
    horse.Notes.push(newNote);
    await Horse.findByIdAndUpdate(id, horse, { runValidators: true });
    return horse;
}

/**
 * Update horse numbers (HeadNr and BoxNr) for specific event
 */
export async function updateHorseNumbers(id, headNumber, boxNumber, eventId) {
    const horse = await Horse.findById(id);
    if (!horse) {
        throw new Error('Horse not found');
    }
    
    // Update HeadNr
    let editedCount = 0;
    horse.HeadNr.forEach(h => {
        if (String(h.eventID) === String(eventId)) {
            h.headNumber = headNumber;
            editedCount++;
        }
    });
    if (editedCount === 0) {
        horse.HeadNr.push({
            headNumber: headNumber,
            eventID: eventId
        });
    }

    // Update BoxNr
    editedCount = 0;
    horse.BoxNr.forEach(b => {
        if (String(b.eventID) === String(eventId)) {
            b.boxNumber = boxNumber;
            editedCount++;
        }
    });
    if (editedCount === 0) {
        horse.BoxNr.push({
            boxNumber: boxNumber,
            eventID: eventId
        });
    }

    await Horse.findByIdAndUpdate(id, horse, { runValidators: true });
    return horse;
}

/**
 * Get horses for specific event from entries
 */
export async function getHorsesForEvent(eventId) {
    const horsesontheEvent = await Entries.find({ event: eventId }).populate('horse').select('horse');
    
    if (horsesontheEvent.length === 0) {
        throw new Error('No entries found for the selected event');
    }
    
    const uniqueHorses = Array.from(new Set(horsesontheEvent.map(entry => entry.horse._id.toString())));
    const horses = await Horse.find({ _id: { $in: uniqueHorses } }).sort({ name: 1 });
    return horses;
}

/**
 * Get all permissions for form data
 */
export async function getAllPermissions() {
    return await Permissions.find();
}
