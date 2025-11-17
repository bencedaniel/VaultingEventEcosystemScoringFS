import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema(
    {
        title:{
            type: String,
            required: [true, 'Alert title required!']
        },
        description: {
            type: String,
            required: [true, 'Alert description required!'],
        },
        permission: {
           type: String,
           required: [true, 'Permission required!'],
        },
        active: {
            type: Boolean,
            default: true,
            required: [true, 'Active status required']
        },
        reappear: {
            type: Number,
            default: 0,
            required: [true, 'Reappear status required']
        },

       
    },
    { timestamps: true }
);

export default mongoose.model('alerts', AlertSchema);
