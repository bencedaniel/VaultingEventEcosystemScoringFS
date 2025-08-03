import mongoose from 'mongoose';
import Horse from './Horse';


const VaulterSchema = new mongoose.Schema({
        Venue:{
            type: String,
            required: [true, 'Venue name required!'],
        },
        Stable:{
            type: String,
            required: [true, 'Stable name required!'],
        },
        Areas:{
            type: [String],
            required: [true, 'Areas required!'],
        },
        Warmupcircles:{
            type: [String],
            required: [true, 'Warmup circles required!'],
        },
        Competitionareas:{
            type: [String],
            required: [true, 'Competition areas required!'],
        },
        Ridingarenas:{
            type: [String],
            required: [true, 'Riding arenas required!'],
        },
        // Needed more fields but i can't read the whiteboard
        Name:{
            type: String,
            required: [true, 'Map name required!'],
        },
        Capacity:{
            type: Number,
            required: [true, 'Capacity required!'],
        },
        Note:{
            type: String,
            default: '',
        },

},{ timestamps: true });

export default mongoose.model('vaulters', HorseSchema);
