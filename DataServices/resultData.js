import Score from '../models/Score.js';
import { logDb } from '../logger.js';

/**
 * Find scores by timetable part, entry, and event
 */
export async function getScoresByTimetableAndEntry(timetablePartId, entryId, eventId) {
    return await Score.find({
        timetablepart: timetablePartId,
        entry: entryId,
        event: eventId
    }).exec();
}

/**
 * Create a new score
 */
export async function createScore(scoreData) {
    const newScore = new Score(scoreData);
    await newScore.save();
    logDb('CREATE', 'Score', `${newScore._id}`);
    return newScore;
}

/**
 * Update an existing score
 */
export async function updateScore(scoreId, scoreData) {
    const score = await Score.findByIdAndUpdate(scoreId, scoreData, { runValidators: true });
    logDb('UPDATE', 'Score', `${scoreId}`);
    await score.save();
    return score;
}

/**
 * Delete a score by ID
 */
export async function deleteScore(scoreId) {
    await Score.findByIdAndDelete(scoreId);
    logDb('DELETE', 'Score', `${scoreId}`);
}

/**
 * Delete multiple scores by IDs
 */
export async function deleteMultipleScores(scoreIds) {
    await Score.deleteMany({ _id: { $in: scoreIds } });
    logDb('DELETE', 'Score', `${scoreIds.join(',')}`);
}
