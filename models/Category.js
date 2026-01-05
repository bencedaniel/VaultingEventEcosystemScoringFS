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
    Horse: { 
        type: { 
            A1 : { type: Number, min: 0.0, max: 1.0, required: true },
            A2 : { type: Number, min: 0.0, max: 1.0, required: true },
            A3 : { type: Number, min: 0.0, max: 1.0, required: true },

        },
        _id: false
    },
    Free: { 
        type: { 
            R : { type: Number, min: 0.0, max: 5.0, required: true },
            D : { type: Number, min: 0.0, max: 5.0, required: true },
            M : { type: Number, min: 0.0, max: 5.0, required: true },
            E : { type: Number, min: 0.0, max: 5.0, required: true }

        },
        _id: false
    },
    Artistic: { 
        type: { 
            CH : { type: Number, min: 0.0, max: 1.0, required: true },
            C1 : { type: Number, min: 0.0, max: 1.0, required: true },
            C2 : { type: Number, min: 0.0, max: 1.0, required: true },
            C3 : { type: Number, min: 0.0, max: 1.0, required: true },
            C4 : { type: Number, min: 0.0, max: 1.0, required: true }
        },
        _id: false
    },
        TechArtistic: { 
        type: { 
            CH : { type: Number, min: 0.0, max: 1.0, required: true },
            T1 : { type: Number, min: 0.0, max: 1.0, required: true },
            T2 : { type: Number, min: 0.0, max: 1.0, required: true },
            T3 : { type: Number, min: 0.0, max: 1.0, required: true },
        },
        _id: false
    },

}, { timestamps: true });

export default mongoose.model('categorys', CategorySchema);
