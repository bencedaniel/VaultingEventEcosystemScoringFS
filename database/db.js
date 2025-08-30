import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {dblogger} from "../logger.js";
import { MONGODB_URI } from '../app.js';
async function connectDB() {
    try {
        // Adatbázis kapcsolódás
        await mongoose.connect(MONGODB_URI);
        dblogger.db('Successfully connected to MongoDB');
        // Kapcsolat lezárása kilépéskor
        process.on('SIGINT', async () => {
            try {
                await mongoose.disconnect();
                dblogger.db('Connection to MongoDB closed.');
                process.exit(0);
            } catch (err) {
                dblogger.error('Failed to connect to MongoDB:', err);
                process.exit(1);
            }
        });
    } catch (err) {
        dblogger.error('Connection error:', err);
        process.exit(1);
    }
}

export default connectDB;