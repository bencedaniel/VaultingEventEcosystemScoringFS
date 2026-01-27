import ScoreSheet from '../models/ScoreSheet.js';
import Score from '../models/Score.js';
import TimetablePart from '../models/Timetablepart.js';
import { logger } from '../logger.js';

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

  return scoreSheet;
}

/**
 * Synchronize scores: create or update Score record based on all judge submissions
 */
export async function syncScoreTable(timetablePartId, entryId, eventId) {
  const score = await Score.find({
    timetablepart: timetablePartId,
    entry: entryId,
    event: eventId
  }).exec();

  const timetablePart = await TimetablePart.findById(timetablePartId).exec();

  const ScoreSheets = await ScoreSheet.find({
    TimetablePartId: timetablePartId,
    EntryId: entryId,
    EventId: eventId
  }).exec();

  // Create new score if none exist and all judges have submitted
  if (score.length === 0 && ScoreSheets.length === timetablePart.NumberOfJudges) {
    const newScore = new Score({
      timetablepart: timetablePartId,
      entry: entryId,
      event: eventId,
      scoresheets: ScoreSheets.map(ss => ({ scoreId: ss._id, table: ss.Judge.table })),
      TotalScore:
        ScoreSheets.reduce((acc, curr) => acc + curr.totalScoreBE, 0) / ScoreSheets.length
    });
    await newScore.save();
    logger.db(
      `New score created for timetablePartId: ${timetablePartId}, EntryId: ${entryId}, EventId: ${eventId}`
    );
    return newScore;
  } else if (score.length === 1) {
    // Update existing score
    const existingScore = score[0];
    existingScore.scoresheets = ScoreSheets.map(ss => ({ scoreId: ss._id, table: ss.Judge.table }));
    existingScore.TotalScore =
      ScoreSheets.reduce((acc, curr) => acc + curr.totalScoreBE, 0) / ScoreSheets.length;
    await existingScore.save();
    logger.db(
      `Score updated for timetablePartId: ${timetablePartId}, EntryId: ${entryId}, EventId: ${eventId}`
    );
    return existingScore;
  } else if (score.length > 1) {
    logger.error(
      `Multiple scores found for timetablePartId: ${timetablePartId}, EntryId: ${entryId}, EventId: ${eventId}`
    );
    return null;
  }

  return null;
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
