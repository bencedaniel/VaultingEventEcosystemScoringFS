import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
    EventName: {
        type: String,
        required: [true, 'Event name required!'],
        unique: true,
    },
    EventLocation: {
        type: String,
        required: [true, 'Event location required!'],
    },
    EventDirectorName: {
        type: String,
        required: [true, 'Event director name required!'],
    },
    EventDirectorContact: {
        type: String,
        required: [true, 'Event director contact required!'],
    },
    map: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'maps',
    },
    StablingMap: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'maps',
    },  
    DailyTimeTables: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'daily_timetables',
        default: [],
    },
    AssignedOfficials: {
        type: [{
            name : { type: String, required: true },
            role : { type: String, required: true },
            contact : { type: String, required: true },

        }]
    },
    selected: {
        type: Boolean,
        default: false
    }
    
},{ timestamps: true });

EventSchema.statics.setSelected = async function(eventId) {
    // Set selected: false for all events except the one with eventId
    await this.updateMany(
        { _id: { $ne: eventId } },
        { $set: { selected: false } }
    );
    // Set selected: true for the specified event
    await this.findByIdAndUpdate(eventId, { selected: true });
};

export default mongoose.model('events', EventSchema);
