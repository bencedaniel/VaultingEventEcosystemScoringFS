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
            type: [{      eventID: { type: mongoose.Schema.Types.ObjectId, ref:'events' ,required: true }, // User who reported the incident
            armNumber: { type: String, required: true }}]
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

// compound index: egy adott vaulter (_id) ArmNr tömbjén belül az eventID csak egyszer szerepelhet
VaulterSchema.index(
  { _id: 1, 'ArmNr.eventID': 1 },
  { unique: true, partialFilterExpression: { 'ArmNr.eventID': { $exists: true } } }
);

// pre-validate check a barátságosabb hibajelzéshez (megakadályozza az index hibát)
VaulterSchema.pre('validate', function(next) {
  if (!Array.isArray(this.ArmNr) || this.ArmNr.length === 0) return next();
  const seen = new Set();
  for (const a of this.ArmNr) {
    if (!a || !a.eventID) continue;
    const id = String(a.eventID);
    if (seen.has(id)) {
      const err = new mongoose.Error.ValidationError(this);
      err.addError('ArmNr', new mongoose.Error.ValidatorError({
        message: 'Minden eventID-hez csak egy ArmNr adható meg az ArmNr tömbben.'
      }));
      return next(err);
    }
    seen.add(id);
  }
  next();
});







export default mongoose.model('vaulters', VaulterSchema);
