import mongoose from 'mongoose';
import Horse from './Horse';


const RoleSchema = new mongoose.Schema({
        roleName:{
            type: String,
            required: [true, 'Role name required!'],
            unique: true,
        },
        permissions:{
            type: [String],
            required: [true, 'Permissions required!'],
        },
        description:{
            type: String,
            default: '',
        },
        power:{
            type: Number,
            default: 1, // Default power level
        },
},{ timestamps: true });

export default mongoose.model('roles', HorseSchema);
