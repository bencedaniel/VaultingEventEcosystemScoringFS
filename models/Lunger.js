import mongoose from 'mongoose';
import Horse from './Horse.js';


const LungerSchema = new mongoose.Schema({
        Name:{
            type: String,
            required: [true, 'Lunger name required!'],
        },
        feiid:{
            type: String,
            required: [true, 'FEI-ID required!'],
            minlength: [8, 'FEI ID must be at 8 characters!'],
            maxlength: [8, 'FEI ID must be at 8 characters!'],
            unique: true,
        },  
        Gender:{
            type: String,
        },
        Nationality:{
            type: String,
            required: [true,'Nationality required!'],
        },
        LungerIncident:{
                    type: [{
                        incidentType: { type: String, required: true, enum :['Injury', 'Withdraw', 'Yellow card','Warning', 'Elimination', 'Disqualification', 'Other'] },
                        description: { type: String, required: true },
                        User: { type: mongoose.Schema.Types.ObjectId, ref:'users' ,required: true }, // User who reported the incident
                        date: { type: Date, default: Date.now },
                        eventID: { type: mongoose.Schema.Types.ObjectId, ref:'events' ,required: true }, // Event where the note was made
                        
                    }],
                    
                },
        
},{ timestamps: true });

export default mongoose.model('lungers', LungerSchema);
