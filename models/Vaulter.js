import mongoose from 'mongoose';
import Horse from './Horse';


const VaulterSchema = new mongoose.Schema({
        Vaultername:{
            type: String,
            required: [true, 'Vaulter name required!'],
        },
        feiid:{
            type: String,
            required: [true, 'FEI-ID required!'],
            unique: true,
        },
        gender:{
            type: String,
            enum:['Male','Female', 'Other']
        },
        Bdate:{
            type: Date,
            required: [true, 'Birthdate required!'],
        },
        Nationality:{
            type: String,
            required: [true,  'Nationality required!'],
        },
        VaulterStatus:{
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },  
        ArmNr:{
            type: String,
            required: [true, 'Arm number required!'],
        },
        Horse:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'horses',
            required: [true, 'Horse required!'],
        },
        Lunger:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'lunger',
            required: [true, 'Lunger required!'],
        },
        
},{ timestamps: true });

export default mongoose.model('vaulters', HorseSchema);
