import resultGroup from '../models/resultGroup.js';
import resultGenerator from '../models/resultGenerator.js';
import Category from '../models/Category.js';
import calcTemplate from '../models/calcTemplate.js';
import DailyTimeTable from '../models/DailyTimeTable.js';
import TimetablePart from '../models/Timetablepart.js';

/**
 * Get all result groups for a specific event with full population
 */
export const getResultGroupsByEvent = async (eventId) => {
    const groups = await resultGroup.find({ event: eventId })
        .populate('event')
        .populate('category')
        .populate('calcTemplate')
        .populate({
            path: 'round1First',
            populate: { path: 'dailytimetable' }
        })
        .populate({
            path: 'round1Second',
            populate: { path: 'dailytimetable' }
        })
        .populate({
            path: 'round2First',
            populate: { path: 'dailytimetable' }
        });
    
    groups.sort((a, b) => b.category.Star - a.category.Star);
    return groups;
};

/**
 * Get result groups for results display (simpler population)
 */
export const getResultGroupsForResults = async (eventId) => {
    const groups = await resultGroup.find({ event: eventId })
        .populate('category')
        .populate('calcTemplate')
        .populate({
            path: 'round1First',
            populate: { path: 'dailytimetable' }
        })
        .populate({
            path: 'round1Second',
            populate: { path: 'dailytimetable' }
        })
        .populate({
            path: 'round2First',
            populate: { path: 'dailytimetable' }
        });
    
    groups.sort((a, b) => b.category.Star - a.category.Star);
    return groups;
};

/**
 * Get single result group by ID
 */
export const getResultGroupById = async (id) => {
    return await resultGroup.findById(id);
};

/**
 * Get result group with full details for detailed results display
 */
export const getResultGroupWithDetails = async (id) => {
    return await resultGroup.findById(id)
        .populate('category')
        .populate('calcTemplate')
        .populate('round1First')
        .populate('round1Second')
        .populate('round2First');
};

/**
 * Get form data for result group creation/editing
 */
export const getGroupFormData = async (eventId) => {
    const categories = await Category.find();
    const calcTemplates = await calcTemplate.find();
    const dailyTimetables = await DailyTimeTable.find({ event: eventId }).select('_id');
    
    const timetableParts = await TimetablePart.find({ 
        dailytimetable: { $in: dailyTimetables.map(dt => dt._id) } 
    }).populate('dailytimetable');
    
    const timetablePartsRound1 = await TimetablePart.find({ 
        dailytimetable: { $in: dailyTimetables.map(dt => dt._id) }, 
        Round: '1' 
    }).populate('dailytimetable');
    
    const timetablePartsRound2 = await TimetablePart.find({ 
        dailytimetable: { $in: dailyTimetables.map(dt => dt._id) }, 
        Round: '2 - Final' 
    }).populate('dailytimetable');

    return {
        categories,
        calcTemplates,
        timetableParts,
        timetablePartsRound1,
        timetablePartsRound2
    };
};

/**
 * Update result group
 */
export const updateResultGroup = async (id, data) => {
    // Validate timetable parts are not the same
    if (data.round1First === data.round1Second || 
        data.round1First === data.round2First || 
        data.round1Second === data.round2First) {
        throw new Error("The same timetable part cannot be selected for multiple rounds.");
    }

    // Convert empty strings to null
    if (data.round1First === "") data.round1First = null;
    if (data.round1Second === "") data.round1Second = null;
    if (data.round2First === "") data.round2First = null;

    return await resultGroup.findByIdAndUpdate(id, data, { new: true });
};

/**
 * Create new result group
 */
export const createResultGroup = async (eventId, data) => {
    // Validate timetable parts are not the same
    if (data.round1First === data.round1Second || 
        data.round1First === data.round2First || 
        data.round1Second === data.round2First) {
        throw new Error("The same timetable part cannot be selected for multiple rounds.");
    }

    // Convert empty strings to null
    if (data.round1First === "") data.round1First = null;
    if (data.round1Second === "") data.round1Second = null;
    if (data.round2First === "") data.round2First = null;

    data.event = eventId;

    const newGroup = new resultGroup(data);
    await newGroup.save();
    return newGroup;
};

/**
 * Delete result group by ID
 */
export const deleteResultGroup = async (id) => {
    return await resultGroup.findByIdAndDelete(id);
};

/**
 * Generate result groups from active generators
 */
export const generateGroupsForActiveGenerators = async (eventId, username) => {
    const activeGenerators = await resultGenerator.find({ active: true });
    
    for (const generator of activeGenerators) {
        const groupExists = await resultGroup.findOne({ 
            event: eventId, 
            category: generator.category 
        });
        
        if (groupExists) {
            continue; // Skip if group already exists
        }
        
        const newResultGroup = new resultGroup({
            event: eventId,
            category: generator.category,
            calcTemplate: generator.calcSchemaTemplate,
        });
        
        await newResultGroup.save();
    }
};
