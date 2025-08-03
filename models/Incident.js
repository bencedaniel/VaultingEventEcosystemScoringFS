import mongoose from 'mongoose';

const IncidentSchema = new mongoose.Schema({
        incidentType: {
            type: String,
            required: [true, 'Incident type required!'],
            enum: ['Injury', 'Equipment Failure', 'Disqualification', 'Other'],
        },
        description: {
            type: String,
            required: [true, 'Incident description required!'],
        },
        date: {
            type: Date,
            required: [true, 'Incident date required!'],
        },

}, { timestamps: true });
export default mongoose.model('incidents', IncidentSchema);
