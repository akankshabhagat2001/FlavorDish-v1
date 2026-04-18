import mongoose from 'mongoose';
import { logger } from './logger.js'; // We will create this

export const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is required in environment variables');
        }

        mongoose.connection.on('connected', () => {
            logger.info('✅ MongoDB connected successfully');
        });

        mongoose.connection.on('error', (error) => {
            logger.error(`❌ MongoDB connection error: ${error.message}`);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('⚠️ MongoDB disconnected');
        });

        await mongoose.connect(mongoUri, {
            retryWrites: true,
            w: 'majority'
        });
        return true;
    } catch (error) {
        console.error('❌ Could not connect to MongoDB:', error.message);
        process.exit(1); 
    }
};

export const closeDB = async () => {
    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed properly.');
    } catch (error) {
        logger.error(`Error closing MongoDB connection: ${error.message}`);
    }
};
