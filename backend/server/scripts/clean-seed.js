import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Restaurant from './models/Restaurant.js';
import MenuItem from './models/MenuItem.js';
import Order from './models/Order.js';

dotenv.config();

async function cleanAndSeed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flavorfinder');
        console.log('✅ MongoDB connected');

        // Clear all test data
        console.log('Clearing old test data...');
        await User.deleteMany({ email: { $in: ['admin@demo.local', 'customer@demo.local', 'restaurant@demo.local', 'driver@demo.local'] } });
        await Restaurant.deleteMany({ name: { $in: ['Agashiye - The Heritage', 'Jasuben\'s Pizza'] } });
        console.log('✅ Old data cleared');

        // Create test users
        const testUsers = [{
                name: 'Admin User',
                email: 'admin@demo.local',
                phone: '+919876543210',
                password: 'admin123',
                role: 'admin',
                address: {
                    street: 'Admin Street',
                    city: 'Ahmedabad',
                    state: 'Gujarat',
                    zipCode: '380001'
                }
            },
            {
                name: 'Customer Demo',
                email: 'customer@demo.local',
                phone: '+919876543211',
                password: 'customer123',
                role: 'customer',
                address: {
                    street: '123 Main Street',
                    city: 'Ahmedabad',
                    state: 'Gujarat',
                    zipCode: '380001'
                }
            },
            {
                name: 'Restaurant Owner',
                email: 'restaurant@demo.local',
                phone: '+919876543212',
                password: 'restaurant123',
                role: 'restaurant_owner',
                address: {
                    street: 'Restaurant Street',
                    city: 'Ahmedabad',
                    state: 'Gujarat',
                    zipCode: '380002'
                }
            },
            {
                name: 'Delivery Driver',
                email: 'driver@demo.local',
                phone: '+919876543213',
                password: 'driver123',
                role: 'delivery_partner',
                address: {
                    street: 'Driver Street',
                    city: 'Ahmedabad',
                    state: 'Gujarat',
                    zipCode: '380003'
                }
            }
        ];

        // Save users (password hashing done by User model pre-save hook)
        console.log('Creating test users...');
        const savedUsers = [];
        for (const userData of testUsers) {
            const user = new User(userData);
            const savedUser = await user.save();
            savedUsers.push(savedUser);
            console.log(`✅ Created user: ${userData.email} (${userData.role})`);
        }

        console.log('\n✅ Database seeding completed successfully!');
        console.log('\nTest Credentials:');
        testUsers.forEach(user => {
            console.log(`${user.email} / ${user.password}`);
        });

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during seeding:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

cleanAndSeed();