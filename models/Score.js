import mongoose from 'mongoose';
import { type } from 'os';

const ScoreSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events',
        required: [true, 'Event required!'],
    },
    entry: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'entries',
        required: [true, 'Entry required!'],
    },
    round: {
        type: String,
        required: [true, 'Round required!'],
    },
    type: {
        type: String,
        enum: ['compulsory', 'freestyle','technical'],
        required: [true, 'Type required!'],
    },
    timetablepart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'timetableparts',
        required: [true, 'Timetable part required!'],
    },
    scoresheets: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'scoressheet',
    required: [true, 'Score required!'],
    },

    score: {
        type: Number,
        required: [true, 'Score required!'],
    },
},{ timestamps: true });

export default mongoose.model('scores', ScoreSchema);
