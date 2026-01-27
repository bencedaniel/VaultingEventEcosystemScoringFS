import DailyTimeTable from '../models/DailyTimeTable.js';
import TimetablePart from '../models/Timetablepart.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import ScoreSheet from '../models/ScoreSheet.js';
import { getAllCategoriesByStar } from './categoryData.js';

/**
 * Get all daily timetables for a specific event
 */
export const getAllDailyTimeTables = async (eventId) => {
    return await DailyTimeTable.find({ event: eventId }).sort({ Date: 1 });
};

/**
 * Get daily timetable by ID
 */
export const getDailyTimeTableById = async (id) => {
    return await DailyTimeTable.findById(id);
};

/**
 * Create new daily timetable
 */
export const createDailyTimeTable = async (data) => {
    const newDailyTimeTable = new DailyTimeTable(data);
    await newDailyTimeTable.save();
    return newDailyTimeTable;
};

/**
 * Update daily timetable by ID
 * Checks if timetable has submitted score sheets before updating
 */
export const updateDailyTimeTable = async (id, data) => {
    const timetableParts = await TimetablePart.find({ dailytimetable: id }).select('_id');
    const timetablePartIds = timetableParts.map(tp => tp._id);
    const scoreSheets = await ScoreSheet.find({ TimetablePartId: { $in: timetablePartIds } });
    
    if (scoreSheets.length > 0) {
        throw new Error('Cannot edit DailyTimeTable with submitted score sheets');
    }

    const dailytimetable = await DailyTimeTable.findByIdAndUpdate(id, data, { runValidators: true });
    return dailytimetable;
};

/**
 * Delete daily timetable by ID
 * Also deletes all associated timetable parts
 */
export const deleteDailyTimeTable = async (id) => {
    await TimetablePart.deleteMany({ dailytimetable: id });
    const dailytimetable = await DailyTimeTable.findByIdAndDelete(id);
    return dailytimetable;
};

/**
 * Get form data for daily timetable creation/editing
 */
export const getDailyTimeTableFormData = async () => {
    return {};
};

/**
 * Get all timetable parts for a specific daily timetable
 */
export const getTimetablePartsByDailyTimeTable = async (dailyTimeTableId) => {
    return await TimetablePart.find({ dailytimetable: dailyTimeTableId })
        .sort({ StartTimePlanned: 1 })
        .populate('Category')
        .exec();
};

/**
 * Get all timetable parts
 */
export const getAllTimetableParts = async () => {
    return await TimetablePart.find();
};

/**
 * Get timetable part by ID with population
 */
export const getTimetablePartById = async (id) => {
    return await TimetablePart.findById(id).populate('dailytimetable');
};

/**
 * Create new timetable part
 */
export const createTimetablePart = async (data) => {
    const newTimetablePart = new TimetablePart(data);
    await newTimetablePart.save();
    return newTimetablePart;
};

/**
 * Update timetable part by ID
 * Checks if timetable part has submitted score sheets before updating
 */
export const updateTimetablePart = async (id, data) => {
    const scoreSheets = await ScoreSheet.find({ TimetablePartId: id });
    if (scoreSheets.length > 0) {
        throw new Error('Cannot edit TimetablePart with submitted score sheets');
    }

    const timetablepart = await TimetablePart.findByIdAndUpdate(
        id,
        data,
        { runValidators: true, new: true }
    );
    return timetablepart;
};

/**
 * Delete timetable part by ID
 */
export const deleteTimetablePart = async (id) => {
    const timetablepart = await TimetablePart.findByIdAndDelete(id);
    return timetablepart;
};

/**
 * Save start time for timetable part
 */
export const saveTimetablePartStartTime = async (id) => {
    const timetablepart = await TimetablePart.findById(id);
    if (!timetablepart) {
        throw new Error('Timetable element not found');
    }

    timetablepart.StartTimeReal = new Date();
    await timetablepart.save();
    return timetablepart;
};

/**
 * Get form data for timetable part creation/editing
 */
export const getTimetablePartFormData = async (eventId) => {
    const OnsiteOfficials = await Event.findOne({ selected: true }).select('AssignedOfficials');
    
    if (!OnsiteOfficials?.AssignedOfficials) {
        throw new Error('No onsite officials found');
    }

    const userPromises = OnsiteOfficials.AssignedOfficials
        .filter(official => official.userID)
        .map(official => User.findById(official.userID).populate('role').select('-password'));
    
    const users = (await Promise.all(userPromises)).filter(Boolean);
    const judges = users.filter(u => u.role?.roleName.includes('Judge'));
    const days = await DailyTimeTable.find({ event: eventId }).sort({ Date: 1 });
    const categorys = await getAllCategoriesByStar();

    return {
        judges,
        days,
        categorys
    };
};
