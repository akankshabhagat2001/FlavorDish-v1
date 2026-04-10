import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ContactQuery, FraudReport, JobApplication } from './models/FormModels.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flavorfinder';

async function createCollections() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB connected successfully');

        await Promise.all([
            ContactQuery.createCollection(),
            FraudReport.createCollection(),
            JobApplication.createCollection()
        ]);

        console.log('✅ Contact/form collections have been created or already exist.');
    } catch (error) {
        console.error('❌ Failed to create collections:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔒 MongoDB connection closed');
        process.exit(0);
    }
}

createCollections();