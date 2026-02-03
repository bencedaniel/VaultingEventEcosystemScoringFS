import mongoose from "mongoose";

const TableMappingSchema = new mongoose.Schema(
    {
        Table: {
            type: String,
            enum: ['A', 'B','C','D','E','F','G','H'],
            required: [true, 'Judge Table ID required!'],
        },
        TestType: {
            type: String,
            enum: ['compulsory', 'free test','technical test'],
            required: [true, 'Test type required!'],
        },
        Role: {
            type: String,
            enum: ['horse', 'compulsory','artistic','technical'],
            required: [true, 'Role required!'],
        },
       
    },
    { timestamps: true }
);

export default mongoose.model('tables', TableMappingSchema);
