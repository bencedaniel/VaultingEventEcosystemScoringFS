import mongoose from "mongoose";

const ScoreSheetSchemaTemp = new mongoose.Schema(
    {
        TestType: [{
            type: String,
            enum: ['compulsory', 'free test','technical'],
            required: [true, "Test type required!"],
        }],

        CategoryId: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "categorys",
            required: [true, "Category ID required!"],
        },
        numberOfJudges: {
            type: Number,
            required: [true, "Number of judges required!"],
            default: 4,
        },  
        typeOfScores: {
            type: String,
            enum: ['horse', 'artistic','technical','compulsory'],
            required: [true, "Type of scores required!"],
        },

        outputFieldList: {
            type: [{
                name: { type: String, required: true },
                contentid: { type: String, required: true },
                position: {
                    x: { type: Number, default: 0 },
                    y: { type: Number, default: 0 },
                    w: { type: Number, default: 100 }
                }
            }],
            default: []
        },
        inputFieldList: {
            type: [{
                name: { type: String, required: true },
                id: { type: String, required: true },
                preDefValue: { type: String, default: '' },
                position: {
                    x: { type: Number, default: 0 },
                    y: { type: Number, default: 0 },
                    w: { type: Number, default: 100 }
                }
            }],
            default: []
        },
        bgImage: {
            type: String,
            required: [true, "Background image required!"],
        }
    
  }, { timestamps: true }
);

ScoreSheetSchemaTemp.get()


export default mongoose.model('scoresheets_temp', ScoreSheetSchemaTemp);