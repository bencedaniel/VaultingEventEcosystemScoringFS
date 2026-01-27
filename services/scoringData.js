import DailyTimeTable from '../models/DailyTimeTable.js';
import TimetablePart from '../models/Timetablepart.js';
import User from '../models/User.js';
import Entries from '../models/Entries.js';
import TableMapping from '../models/TableMapping.js';
import Event from '../models/Event.js';
import ScoreSheetTemp from '../models/ScoreSheetTemp.js';

/**
 * Get today's daily timetable
 */
export async function getTodaysTimetable() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  return await DailyTimeTable.findOne({ Date: { $gte: start, $lt: end } });
}

/**
 * Get timetable parts for a daily timetable with categories
 */
export async function getTimetablePartsByDaily(dailyId) {
  return await TimetablePart.find({ dailytimetable: dailyId }).populate('Category').exec();
}

/**
 * Get a timetable part with all nested relationships
 */
export async function getTimetablePartById(id) {
  return await TimetablePart.findById(id)
    .populate('Category')
    .populate({
      path: 'StartingOrder.Entry',
      populate: [
        { path: 'vaulter' },
        { path: 'category' },
        { path: 'lunger' },
        { path: 'horse' }
      ]
    })
    .exec();
}

/**
 * Get a timetable part with dailytimetable populated
 */
export async function getTimetablePartByIdWithDaily(id) {
  return await TimetablePart.findById(id).populate('dailytimetable').exec();
}

/**
 * Get all timetable parts for events within specified date range
 */
export async function getTimetablePartsByEvents(eventIds) {
  const dailytables = await DailyTimeTable.find({ event: { $in: eventIds } }).exec();
  return await TimetablePart.find({ dailytimetable: { $in: dailytables.map(dt => dt._id) } })
    .populate('dailytimetable')
    .populate({
      path: 'StartingOrder',
      populate: [
        {
          path: 'Entry',
          populate: [{ path: 'vaulter' }]
        }
      ]
    })
    .exec();
}

/**
 * Get judge information
 */
export async function getJudgeById(judgeId) {
  return await User.findById(judgeId).exec();
}

/**
 * Get entries for an event
 */
export async function getEntriesByEvent(eventId) {
  return await Entries.find({ event: eventId })
    .populate('vaulter')
    .populate('category')
    .populate('lunger')
    .populate('horse')
    .exec();
}

/**
 * Get a single entry by ID
 */
export async function getEntryById(entryId) {
  return await Entries.findById(entryId)
    .populate('vaulter')
    .populate('category')
    .populate('lunger')
    .populate('horse')
    .exec();
}

/**
 * Get table mapping for a table and test type
 */
export async function getTableMapping(table, testType) {
  return await TableMapping.findOne({
    Table: table,
    TestType: testType.toLocaleLowerCase()
  }).exec();
}

/**
 * Get event by ID
 */
export async function getEventById(eventId) {
  return await Event.findById(eventId).exec();
}
/**
 * Get score sheet template by test type, category, number of judges, and role
 */
export async function getScoreSheetTemplate(testType, categoryId, numberOfJudges, role) {
  return await ScoreSheetTemp.findOne({
    TestType: { $regex: new RegExp(`^${testType}$`, 'i') },
    CategoryId: categoryId,
    numberOfJudges: numberOfJudges,
    typeOfScores: role
  }).exec();
}

/**
 * Get all timetable parts for an event
 */
export async function getTimetablePartsByEvent(eventId) {
  const dailytables = await DailyTimeTable.find({ event: eventId }).exec();
  return await TimetablePart.find({ dailytimetable: { $in: dailytables.map(dt => dt._id) } })
    .populate('dailytimetable')
    .populate({
      path: 'StartingOrder',
      populate: [
        { 
          path: 'Entry',
          populate: [
            { path: 'vaulter' }
          ]
        }
      ]
    })
    .exec();
}