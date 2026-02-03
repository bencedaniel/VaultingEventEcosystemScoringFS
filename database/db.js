import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {logger, logError, logInfo} from "../logger.js";
import { MONGODB_URI } from '../app.js';
async function connectDB() {
    try {
        // Adatbázis kapcsolódás
        await mongoose.connect(MONGODB_URI);
        logInfo('Successfully connected to MongoDB');
        // Kapcsolat lezárása kilépéskor
        process.on('SIGINT', async () => {
            try {
                await mongoose.disconnect();
                logInfo('Connection to MongoDB closed.');
                process.exit(0);
            } catch (err) {
                logError('DB_DISCONNECT', 'Failed to disconnect from MongoDB', err.toString());
                process.exit(1);
            }
        });
    } catch (err) {
        logError('DB_CONNECTION', 'Connection error', err.toString());
        process.exit(1);
    }
}

export default connectDB;