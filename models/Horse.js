import mongoose from 'mongoose';


const HorseSchema = new mongoose.Schema({
      Horsename:{
        type: String,
        required: [true, 'Horsename required!'],
        unique: true,
      },
        feiid:{
            type: String,
            required: [true, 'FEI-ID required!'],
            unique: true,
        },
        gender:{
            type: String,
        },
        Bdate:{
            type: Date,
            required: [true, 'Birthdate required!'],
        },
        Nationality:{
            type: String,
            required: [true, 'Nationality required!'],
        },
        VetCheckStatus:{
            type: String,
            enum: ['before','passed', 'failed', 'pending'],
            default: 'before',

        },
        HorseStatus:{
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        Temp:{
            type: [Number],
            default: 0.0,
        },
        BoxNr:{
            type: String,
            required: [true, 'Box number required!'],
        },
        HeadNr:{
            type: String,
            required: [true, 'Head number required!'],
        },
        Notes:{
            type: [String],
            default: '',
        },

        
},{ timestamps: true });

export default mongoose.model('horses', HorseSchema);
