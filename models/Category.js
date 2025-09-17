import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    CategoryDispName: {
        type: String,
        required: [true, 'Category name required!'],
        unique: true,
    },
    Type: {
        type: String,
        enum: ['Individual', 'Squad','PDD'],
        required: [true, 'Category type required!'],
    },
    Sex: {
        type: String,
        enum: ['Male', 'Female', 'Mixed'],
    },
    ReqComp: { type: Boolean, required: true, default: false },
    ReqFreeTest: { type: Boolean, required: true, default: false },
    ReqTechnicalTest: { type: Boolean, required: true, default: false },
    Agegroup: {
        type: String,
        enum: ['Children', 'Junior', 'Senior', 'Young Vaulter'],
        required: [true, 'Age group required!'],
    },
    Star: {
        type: Number,
        required: [true, 'Star level required!'],
        default: 0,
        max: 4,
        min: 1,
    },
    Compulsory: { 
        type: { 
            Horse : { type: Number, min: 0.0, max: 1.0, required: true },
            Exercise : { type: Number, min: 0.0, max: 1.0, required: true },
        },
        _id: false
    },
    Free: { 
        type: { 
            Horse : { type: Number, min: 0.0, max: 1.0, required: true },
            Artistic : { type: Number, min: 0.0, max: 1.0, required: true },
            Technical : { type: Number, min: 0.0, max: 1.0, required: true },
        },
        _id: false
    },
    Technical: { 
        type: { 
            Horse : { type: Number, min: 0.0, max: 1.0, required: true },
            Artistic : { type: Number, min: 0.0, max: 1.0, required: true },
            Technical : { type: Number, min: 0.0, max: 1.0, required: true },
        },
        _id: false
    },

}, { timestamps: true });

export default mongoose.model('categorys', CategorySchema);
