import mongoose from 'mongoose';


const CategorySchema = new mongoose.Schema({
        CategoryName:{
            type: String,
            required: [true, 'Category name required!'],
            unique: true,
        },
        Type:{
            type: String,
            enum: ['Individual', 'Squad','PDD'],
            required: [true, 'Category type required!'],
        },
        // Here we can specify the group specific counting and scoring rules
        CalculatingRules:{
            type: String,
            default: '',
        },
        
        
},{ timestamps: true });

export default mongoose.model('categorys', HorseSchema);
