import mongoose from 'mongoose';


const EntriesSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events',
        required: [true, 'Event required!'],
    },
    vaulter: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vaulters',
        required: [true, 'Vaulter required!'],
        maxlength: [6, 'A maximum of 6 vaulters can be assigned to an entry.']
    }],

    horse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'horses',
        required: [true, 'Horse required!'],
    },
    lunger: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lungers',
        required: [true, 'Lunger required!'],
    },
        category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categorys',
        required: [true, 'Category required!'], 
    },
    entryDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['registered', 'withdrawn', 'confirmed', 'cancelled'],
        default: 'registered',
    },
    teamName: {
        type: String,
        default: '',
        maxlength: [100, 'Team name cannot exceed 100 characters.']
    },
}, { timestamps: true });



export default mongoose.model('entries', EntriesSchema);