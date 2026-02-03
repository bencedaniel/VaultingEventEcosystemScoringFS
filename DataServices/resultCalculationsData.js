import Event from '../models/Event.js';
import Entries from '../models/Entries.js';
import Score from '../models/Score.js';

/**
 * Get selected event
 */
export async function getSelectedEvent() {
    return await Event.findOne({ selected: true });
}

/**
 * Get entries by event and category
 */
export async function getEntriesByEventAndCategory(eventId, categoryId) {
    return await Entries.find({ event: eventId, category: categoryId });
}

/**
 * Get scores for timetable part
 */
export async function getScoresForTimetablePart(entryIds, timetablePartID) {
    return await Score.find({
        entry: { $in: entryIds },
        timetablepart: timetablePartID
    }).populate({
        path: 'entry',
        populate: [
            { path: 'horse' },
            { path: 'vaulter' },
            { path: 'lunger' }
        ]
    }).populate({
        path: 'scoresheets.scoreId',
        select: 'totalScoreBE'
    });
}

/**
 * Get entry with all populated fields
 */
export async function getEntryWithPopulation(entryId) {
    return await Entries.findById(entryId)
        .populate('horse')
        .populate('vaulter')
        .populate('lunger');
}
