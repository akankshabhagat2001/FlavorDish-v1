import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function initializeDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flavorfinder');
        console.log('✅ MongoDB connected\n');

        // Clear existing test users
        console.log('🗑️ Clearing old test users...');
        await User.deleteMany({
            email: { $in: ['admin@demo.local', 'customer@demo.local', 'restaurant@demo.local', 'driver@demo.local'] }
        });
        console.log('✅ Old users cleared\n');

        // Test users with plain text passwords (to be hashed)
        const testUsers = [{
                name: 'Admin User',
                email: 'admin@demo.local',
                phone: '+919876543210',
                password: 'admin123',
                role: 'admin'
            },
            {
                name: 'Customer Demo',
                email: 'customer@demo.local',
                phone: '+919876543211',
                password: 'customer123',
                role: 'customer'
            },
            {
                name: 'Restaurant Owner',
                email: 'restaurant@demo.local',
                phone: '+919876543212',
                password: 'restaurant123',
                role: 'restaurant_owner'
            },
            {
                name: 'Delivery Driver',
                email: 'driver@demo.local',
                phone: '+919876543213',
                password: 'driver123',
                role: 'delivery_partner'
            }
        ];

        console.log('👥 Creating test users with hashed passwords...\n');
        for (const userData of testUsers) {
            // Let User model handle hashing via pre-save hook
            const user = new User({
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                password: userData.password,
                role: userData.role
            });

            await user.save();
            console.log(`✅ Created: ${userData.email}`);
            console.log(`   Password: ${userData.password}`);
            console.log(`   Role: ${userData.role}\n`);
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ DATABASE INITIALIZATION COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('📋 TEST CREDENTIALS:\n');
        testUsers.forEach(user => {
            console.log(`📧 Email: ${user.email}`);
            console.log(`🔐 Password: ${user.password}`);
            console.log(`👤 Role: ${user.role}\n`);
        });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('HOW TO LOGIN:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Go to: http://localhost:3001');
        console.log('2. Click "Log in"');
        console.log('3. Enter email and password from above');
        console.log('4. OTP will be PRINTED IN BACKEND CONSOLE');
        console.log('5. Copy OTP and paste in the app');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (mongoose.connection.readyState) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
}

initializeDatabase();