import mongoose from "mongoose";

const ScoreSheetSchema = new mongoose.Schema(
    {
        EventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "events",
            required: [true, "Event ID required!"],
        },
        EntryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "entries",
            required: [true, "Entry ID required!"],
        },
        TemplateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "scoresheettemps",
            required: [true, "Template ID required!"],
        },
        TimetablePartId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "timetableparts",
            required: [true, "Timetable Part ID required!"],
        },

        Judge: {
            userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, "Judge info required!"],
            refPath: "users" // dinamikus collection
            },
            table: {
            type: String,
            required: true
            }
        }
        ,

        inputDatas: {
            type: [{id:String, value: String}],
            default: [],
            required: [true, "Input data required!"],
        },
        totalScoreFE: {
            type: Number,
            required: [true, "Total score required!"],
        },
        totalScoreBE: {
            type: Number,
            required: [true, "Total score required!"],
        }
        
  }, { timestamps: true }
);

ScoreSheetSchema.index(
  { EventId: 1, EntryId: 1, TemplateId: 1 , TimetablePartId: 1, 'Judge.JudgeTable': 1 },
  { unique: true }
);
ScoreSheetSchema.pre('save', function(next) {
    if(this.totalScoreBE !== this.totalScoreFE){
        throw new Error('Total score mismatch between front-end and back-end values');
    }   

    next();
});
export default mongoose.model("scoresheets", ScoreSheetSchema);