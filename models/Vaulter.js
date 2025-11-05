import mongoose from 'mongoose';


const VaulterSchema = new mongoose.Schema({
        Name:{
            type: String,
            required: [true, 'Vaulter name required!'],
        },
        feiid:{
            type: String,
            required: [true, 'FEI-ID required!'],
            minlength: [8, 'FEI ID must be at 8 characters!'],
            maxlength: [8, 'FEI ID must be at 8 characters!'],
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
        Status:{
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },  
        ArmNr:{
            type: String,
            required: [true, 'Arm number required!'],
        },  
        VaulterIncident:{
            type: [{
                incidentType: { type: String, required: true, enum :['Injury', 'Withdraw', 'Yellow card','Warning', 'Elimination', 'Disqualification', 'Other'] },
                description: { type: String, required: true },
                User: { type: mongoose.Schema.Types.ObjectId, ref:'users' ,required: true }, // User who reported the incident
                date: { type: Date, default: Date.now },
                eventID: { type: mongoose.Schema.Types.ObjectId, ref:'events' ,required: true }, // Event where the note was made
            }],
            
        },
        

        
},{ timestamps: true });

export default mongoose.model('vaulters', VaulterSchema);
