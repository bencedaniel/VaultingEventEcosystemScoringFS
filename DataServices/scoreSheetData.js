import ScoreSheet from '../models/ScoreSheet.js';
import Score from '../models/Score.js';
import TimetablePart from '../models/Timetablepart.js';
import { logger } from '../logger.js';
import { logDb } from '../logger.js';

/**
 * Fetch submitted score sheets for a judge in a timetable part
 */
export async function getSubmittedScoreSheets(timetablePartId, entryId, eventId, judgeId) {
  return await ScoreSheet.find({
    TimetablePartId: timetablePartId,
    EntryId: entryId,
    EventId: eventId,
    'Judge.userId': judgeId
  }).exec();
}

/**
 * Fetch all score sheets for an event with full relationships
 */
export async function getEventScoreSheets(eventId) {
  return await ScoreSheet.find({ EventId: eventId })
    .populate({
      path: 'EntryId',
      populate: [
        { path: 'vaulter' },
        { path: 'category' }
      ]
    })
    .populate('TimetablePartId')
    .populate({
      path: 'Judge.userId',
      model: 'users'
    })
    .exec();
}

/**
 * Fetch a specific score sheet by ID with all relationships
 */
export async function getScoreSheetById(scoresheetId) {
  return await ScoreSheet.findById(scoresheetId)
    .populate('EventId')
    .populate('TemplateId')
    .populate({
      path: 'TimetablePartId',
      populate: [
        { path: 'dailytimetable' }
      ]
    })
    .populate({
      path: 'Judge.userId',
      model: 'users'
    })
    .populate({
      path: 'EntryId',
      populate: [
        { path: 'vaulter' },
        { path: 'lunger' },
        { path: 'horse' },
        { path: 'category' }
      ]
    })
    .exec();
}

/**
 * Save a new score sheet and update timetable part's starting order
 */
export async function saveScoreSheet(scoreSheetData, timetablePartId, entryId) {
  const newScoreSheet = new ScoreSheet(scoreSheetData);
  await newScoreSheet.save();
  logDb('CREATE', 'ScoreSheet', `${newScoreSheet._id}`);

  // Update timetable part's starting order
  const timetablePart = await TimetablePart.findById(timetablePartId);
  timetablePart.StartingOrder.forEach(participant => {
    if (participant.Entry.toString() === entryId.toString()) {
      participant.submittedtables.push({
        JudgeID: scoreSheetData.Judge.userId,
        Table: scoreSheetData.Judge.table
      });
    }
  });
  await timetablePart.save();
  logDb('UPDATE', 'TimetablePart', `${timetablePartId}`);

  return newScoreSheet;
}

/**
 * Update a score sheet and update timetable part's starting order
 */
export async function updateScoreSheet(scoresheetId, scoreSheetData, timetablePartId, entryId) {
  const scoreSheet = await ScoreSheet.findByIdAndUpdate(scoresheetId, scoreSheetData, {
    runValidators: true
  });
  await scoreSheet.save();
  logDb('UPDATE', 'ScoreSheet', `${scoresheetId}`);

  // Update timetable part's starting order
  const timetablePart = await TimetablePart.findById(timetablePartId);
  timetablePart.StartingOrder.forEach(participant => {
    if (participant.Entry.toString() === entryId.toString()) {
      if (
        !participant.submittedtables.some(
          st =>
            st.JudgeID.toString() === scoreSheetData.Judge.userId.toString() &&
            st.Table === scoreSheetData.Judge.table
        )
      ) {
        participant.submittedtables.push({
          JudgeID: scoreSheetData.Judge.userId,
          Table: scoreSheetData.Judge.table
        });
      }
    }
  });
  await timetablePart.save();
  logDb('UPDATE', 'TimetablePart', `${timetablePartId}`);

  return scoreSheet;
}

/**
 * Get all scores for an event with full relationships
 */
export async function getEventScores(eventId) {
  return await Score.find({ event: eventId })
    .populate('timetablepart')
    .populate({
      path: 'entry',
      populate: [{ path: 'vaulter' }, { path: 'category' }]
    })
    .exec();
}

/**
 * Get a score by ID
 */
export async function getScoreById(scoreId) {
  return await Score.findById(scoreId).exec();
}
