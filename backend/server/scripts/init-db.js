const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'restaurant_owner', 'delivery_partner', 'admin'], default: 'customer' },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

async function initialize() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flavorfinder', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB connected\n');

        const User = mongoose.model('User', userSchema);

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
            // Hash password manually before saving
            const salt = await bcryptjs.genSalt(10);
            const hashedPassword = await bcryptjs.hash(userData.password, salt);

            const user = new User({
                ...userData,
                password: hashedPassword
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
        console.log('4. OTP will be PRINTED IN THIS CONSOLE');
        console.log('5. Copy OTP from console and paste in app\n');

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
}

initialize();