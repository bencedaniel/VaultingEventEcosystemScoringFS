import mongoose from 'mongoose';


const PermissionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    attachedURL: { type: [{url: { type: String, required: true }, parent: { type: String, required: true }}], required: true },
},{ timestamps: true });

export default mongoose.model('permission', PermissionSchema);
