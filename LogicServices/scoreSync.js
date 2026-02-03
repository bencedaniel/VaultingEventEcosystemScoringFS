import { logDebug, logDb } from '../logger.js';
import { getScoresByTimetableAndEntry, createScore, updateScore, deleteMultipleScores } from '../DataServices/resultData.js';
import { getSubmittedScoreSheets } from '../DataServices/scoreSheetData.js';
import { getTimetablePartById } from '../DataServices/dailyTimetableData.js';
import { ValidationError } from '../middleware/errorHandler.js';

export async function syncScoreTable(timetablePartId, EntryID, EventId) {
  const scores = await getScoresByTimetableAndEntry(timetablePartId, EntryID, EventId);
  const timetablePart = await getTimetablePartById(timetablePartId);
  const scoreSheets = await getSubmittedScoreSheets(timetablePartId, EntryID, EventId);

  logDebug('Score sync', `${scores.length} scores found for timetablePartId: ${timetablePartId}, EntryId: ${EntryID}, EventId: ${EventId}`);

  const scoreData = {
    timetablepart: timetablePartId,
    entry: EntryID,
    event: EventId,
    scoresheets: scoreSheets.map(ss => ({ scoreId: ss._id, table: ss.Judge.table })),
    TotalScore: scoreSheets.length > 0 ? scoreSheets.reduce((acc, curr) => acc + curr.totalScoreBE, 0) / scoreSheets.length : 0
  };

  if(scores.length === 0 && scoreSheets.length === timetablePart.NumberOfJudges){
    const newScore = await createScore(scoreData);
    logDb('CREATE', 'Score', `timetablePart:${timetablePartId}, Entry:${EntryID}`);
    return newScore;
  } 
  else if(scores.length === 1){
    const updatedScore = await updateScore(scores[0]._id, scoreData);
    logDb('UPDATE', 'Score', `${scores[0]._id}`);
    return updatedScore;
  } 
  else if(scores.length === 0) {
    return null;
  }
  else {

    throw new ValidationError(`Data inconsistency: Multiple scores found for timetablePartId: ${timetablePartId}, EntryId: ${EntryID}, EventId: ${EventId}`);
  }
}