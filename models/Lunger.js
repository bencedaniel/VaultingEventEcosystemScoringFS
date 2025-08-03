import mongoose from 'mongoose';
import Horse from './Horse';


const LungerSchema = new mongoose.Schema({
        Lungername:{
            type: String,
            required: [true, 'Lunger name required!'],
        },
        feiid:{
            type: String,
            required: [true, 'FEI-ID required!'],
            unique: true,
        },  
        Gender:{
            type: String,
        },
        Nationality:{
            type: String,
            required: [true,'Nationality required!'],
        },
        
},{ timestamps: true });

export default mongoose.model('lungers', HorseSchema);
