import mongoose from 'mongoose';

const TimetablePartSchema = new mongoose.Schema({

        Name: {
            type: String,
            required: [true, 'Timetable part name required!'],
        },
        dailytimetable: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'daily_timetables',
            required: [true, 'Daily timetable required!'],
        },
        StartTimePlanned: {
            type: String,  // "HH:MM" formátum
            required: [true, 'Start time required!'],
            validate: {
                validator: function(v) {
                    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
                },
                message: 'Invalid time format (HH:MM required)'
            }
        },
        StartTimeReal: {
            type: Date, 
            default: null,
        },
        Category: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'categorys',
            required: [true, 'Category required!'],
        },
        TestType: {
            type: String,
            enum: ['Compulsory', 'Free Test', 'Technical Test'],
            required: [true, 'Test type required!'],
        },
        Round: {
            type: String,
            enum: ['1', '2', 'Final'],
            required: [true, 'Round required!'],
        },
        StartingOrder: {
            type: [{
              Entry: { type: mongoose.Schema.Types.ObjectId, ref: 'entries', required: [true, 'Entry is required'] },
              Order: { type: Number, required: [true, 'Order is required'] },
              submittedtables: [{JudgeID: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }, Table: String}],
            }],
            default: [],
        },
        drawingDone: {
            type: Boolean,
            default: false,
            required: [true, 'Drawing done status required!'],
        },
        conflictsChecked: {
            type: Boolean,
            default: false,
            required: [true, 'Conflicts checked status required!'],
        },
        NumberOfJudges: {
            type: Number,
            enum: [1,2,4,6,8],
            required: [true, 'Number of judges required!'],
        },
        Judges: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'entries',
            default: [],
        },
        JudgesList: {
            type: [{JudgeUserID:mongoose.Schema.Types.ObjectId, Table: String}],
            default: [],
            unique: true
        }
    },{ timestamps: true });
export default mongoose.model('timetableparts', TimetablePartSchema);
