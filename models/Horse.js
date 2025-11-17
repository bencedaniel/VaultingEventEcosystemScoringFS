import mongoose from 'mongoose';

const HorseSchema = new mongoose.Schema({
  Horsename: {
    type: String,
    required: [true, 'Horsename required!'],
    unique: true,
  },
  feiid: {
    type: String,
    required: [true, 'FEI-ID required!'],
    unique: true,
    match: [/^[A-Za-z0-9]{7}$/, 'FEI-ID must be exactly 7 characters!'],
    
  },
  sex: {
    type: String,
    enum: ['Mare','Gelding','Stallion'],
    required: [ true, 'Sex required!'],
  },
  Bdate: {
    type: Date,
    required: [true, 'Birthdate required!'],
  },
  Nationality: {
    type: String,
    required: [true, 'Nationality required!'],
  },
  VetCheckStatus: {
    type: [{
      status: { type: String, required: true, enum: [ 'passed', 'failed', 'pending', 'holding', 'reinspection', 'withdrawn', 'ToBeFollowed'], },
      eventID: { type: mongoose.Schema.Types.ObjectId, ref:'events' ,required: true }, // User who reported the incident
      date: { type: Date, default: Date.now},
      user: { type: mongoose.Schema.Types.ObjectId, ref:'users' ,required: true }, // User who reported the incident
  }],
  },
  HorseStatus: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },

  BoxNr: {
    type: [{      eventID: { type: mongoose.Schema.Types.ObjectId, ref:'events' ,required: true }, // User who reported the incident
      boxNumber: { type: String, required: true }}]
  },
  HeadNr: {
    type: [{      eventID: { type: mongoose.Schema.Types.ObjectId, ref:'events' ,required: true }, // User who reported the incident
      headNumber: { type: String, required: true }}]
  },
  Notes: {
    type: [{
      note: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
      eventID: { type: mongoose.Schema.Types.ObjectId, ref:'events' ,required: true }, // Event where the note was made

    }],
    default: [],
  },
  ResponsiblePersonName: {
    type: String,
    required: [true, 'Responsible person name required!'],
    },
    ResponsiblePersonContact: {
        type: String,
        required: [true, 'Responsible person contact required!'],
    },
}, { timestamps: true });

export default mongoose.model('horses', HorseSchema);
