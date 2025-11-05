import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {logger} from "../logger.js";
import { MONGODB_URI } from '../app.js';
async function connectDB() {
    try {
        // Adatbázis kapcsolódás
        await mongoose.connect(MONGODB_URI);
        logger.db('Successfully connected to MongoDB');
        // Kapcsolat lezárása kilépéskor
        process.on('SIGINT', async () => {
            try {
                await mongoose.disconnect();
                logger.db('Connection to MongoDB closed.');
                process.exit(0);
            } catch (err) {
                logger.error('Failed to connect to MongoDB: ' + err);
                process.exit(1);
            }
        });
    } catch (err) {
        logger.error('Connection error: '+ err);
        process.exit(1);
    }
}

export default connectDB;