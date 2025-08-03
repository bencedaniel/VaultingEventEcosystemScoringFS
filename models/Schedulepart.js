import mongoose from 'mongoose';
import Category from './Category';

const SchedulePartSchema = new mongoose.Schema({
        Name: {
            type: String,
            required: [true, 'Schedule part name required!'],
        },
        StartTimePlanned: {
            type: Date,
            required: [true, 'Start time required!'],
        },
        StartTimeReal: {
            type: Date, 
            default: null,
        },
        Category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'categorys',
            required: [true, 'Category required!'],
        },
        JudgeA: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: [true, 'Judge A required!'],
        },
        JudgeB: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: [true, 'Judge B required!'],
        },
        JudgeC: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: [true, 'Judge C required!'],
        },
        JudgeD: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: [true, 'Judge D required!'],
        },
        JudgeE: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
        },
        JudgeF: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
        },
        JudgeG: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
        },
        JudgeH: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
        },
        StartList: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'startlist',
            required: [true, 'Start list required!'],
        },

    },{ timestamps: true });
export default mongoose.model('scheduleparts', SchedulePartSchema);
