import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Restaurant from './models/Restaurant.js';

dotenv.config();

async function seedDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flavorfinder');
        console.log('✅ MongoDB connected');

        // Check if test users already exist
        const existingAdmin = await User.findOne({ email: 'admin@demo.local' });
        if (existingAdmin) {
            console.log('Test data already exists, skipping seed');
            await mongoose.disconnect();
            return;
        }

        // Create test users
        const testUsers = [{
                name: 'Admin User',
                email: 'admin@demo.local',
                phone: '+919876543210',
                password: 'admin123', // Will be hashed
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
                name: 'Agashiye Owner',
                email: 'agashiye@demo.local',
                phone: '+91 79-2640-7445',
                password: 'owner123',
                role: 'restaurant_owner',
                address: {
                    street: 'Haveli, Lal Darwaja',
                    city: 'Ahmedabad',
                    state: 'Gujarat',
                    zipCode: '380001'
                }
            },
            {
                name: 'Jasuben Owner',
                email: 'jasuben@demo.local',
                phone: '+91 79-2650-5240',
                password: 'owner123',
                role: 'restaurant_owner',
                address: {
                    street: 'Law Garden Area, Lal Darwaja',
                    city: 'Ahmedabad',
                    state: 'Gujarat',
                    zipCode: '380001'
                }
            },
            {
                name: 'Delivery Partner',
                email: 'delivery@demo.local',
                phone: '+919876543213',
                password: 'delivery123',
                role: 'delivery_partner',
                address: {
                    street: '789 Delivery Lane',
                    city: 'Ahmedabad',
                    state: 'Gujarat',
                    zipCode: '380003'
                }
            }
        ];

        // Save users (password hashing done by User model pre-save hook)
        const savedUsers = [];
        for (const userData of testUsers) {
            const user = new User(userData);
            const savedUser = await user.save();
            savedUsers.push(savedUser);
            console.log(`✅ Created user: ${userData.email} (${userData.role})`);
        }

        // Create restaurants linked to restaurant owners
        const restaurantOwners = savedUsers.filter(u => u.role === 'restaurant_owner');

        const restaurants = [{
                name: 'Agashiye - The Heritage',
                description: 'Iconic rooftop terrace restaurant offering authentic unlimited Gujarati thali with traditional hospitality in a stunning heritage setting overlooking Lal Darwaja.',
                owner: restaurantOwners[0]._id,
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
                thumbnailUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
                cuisine: ['Gujarati', 'Heritage', 'Pure Veg', 'Indian'],
                address: {
                    street: 'Haveli, Lal Darwaja',
                    area: 'Lal Darwaja',
                    city: 'Ahmedabad',
                    state: 'Gujarat',
                    zipCode: '380001',
                    coordinates: {
                        latitude: 23.186111,
                        longitude: 72.539444
                    }
                },
                phone: '+91 79-2640-7445',
                email: 'agashiye@demo.local',
                rating: 4.8,
                deliveryTime: '50 mins',
                costForTwo: 2400,
                isOpen: true,
                openingHours: {
                    monday: { open: '11:00', close: '23:00' },
                    tuesday: { open: '11:00', close: '23:00' },
                    wednesday: { open: '11:00', close: '23:00' },
                    thursday: { open: '11:00', close: '23:00' },
                    friday: { open: '11:00', close: '23:30' },
                    saturday: { open: '10:00', close: '23:30' },
                    sunday: { open: '10:00', close: '23:00' }
                },
                deliveryFee: 40,
                tablePrice: 500,
                chairPrice: 200
            },
            {
                name: "Jasuben's Pizza",
                description: 'The legendary thin-crust pizza that defined Ahmedabad street food for generations. Famous for authentic flavor with Indian spices and secret recipe. Lal Darwaja institution for over 30 years.',
                owner: restaurantOwners[1]._id,
                imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800&q=80',
                thumbnailUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&q=80',
                cuisine: ['Pizza', 'Gujarati', 'Street Food'],
                address: {
                    street: 'Law Garden Area, Lal Darwaja',
                    area: 'Law Garden - Lal Darwaja',
                    city: 'Ahmedabad',
                    state: 'Gujarat',
                    zipCode: '380001',
                    coordinates: {
                        latitude: 23.1901,
                        longitude: 72.5404
                    }
                },
                phone: '+91 79-2650-5240',
                email: 'jasuben@demo.local',
                rating: 4.5,
                deliveryTime: '20 mins',
                costForTwo: 350,
                isOpen: true,
                openingHours: {
                    monday: { open: '12:00', close: '22:00' },
                    tuesday: { open: '12:00', close: '22:00' },
                    wednesday: { open: '12:00', close: '22:00' },
                    thursday: { open: '12:00', close: '22:00' },
                    friday: { open: '12:00', close: '22:30' },
                    saturday: { open: '11:00', close: '22:30' },
                    sunday: { open: '11:00', close: '22:00' }
                },
                deliveryFee: 25,
                tablePrice: 80,
                chairPrice: 40
            }
        ];

        // Save restaurants
        for (const restaurantData of restaurants) {
            const restaurant = new Restaurant(restaurantData);
            await restaurant.save();
            console.log(`✅ Created restaurant: ${restaurantData.name}`);
        }

        console.log('\n🎉 Database seeded with test users and restaurants!');
        console.log('\nTest Credentials:');
        console.log('─'.repeat(60));
        testUsers.forEach(user => {
            console.log(`Email: ${user.email}`);
            console.log(`Password: ${user.password}`);
            console.log(`Role: ${user.role}`);
            console.log('─'.repeat(60));
        });

    } catch (error) {
        console.error('❌ Seed error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Database connection closed');
    }
}

seedDatabase();