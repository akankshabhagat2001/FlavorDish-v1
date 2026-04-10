import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from './models/Restaurant.js';
import User from './models/User.js';

dotenv.config();

const realAhmedabadRestaurants = [{
        name: "Agashiye",
        type: "restaurant",
        rating: 4.8,
        totalRatings: 450,
        area: "Lal Darwaja",
        address: "Haveli, Lal Darwaja, Ahmedabad",
        coordinates: { latitude: 23.0258, longitude: 72.5873 },
        delivery: true,
        dine_in: true,
        cuisine: ["Gujarati", "Indian", "Vegetarian"],
        costForTwo: 2400,
        deliveryTime: "45-60 mins",
        phone: "+91-79-26407445",
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
    },
    {
        name: "Jasuben Pizza",
        type: "restaurant",
        rating: 4.5,
        totalRatings: 320,
        area: "Law Garden",
        address: "Law Garden Area, Lal Darwaja, Ahmedabad",
        coordinates: { latitude: 23.0301, longitude: 72.5611 },
        delivery: true,
        dine_in: true,
        cuisine: ["Pizza", "Italian", "Fast Food"],
        costForTwo: 400,
        deliveryTime: "30-45 mins",
        phone: "+91-79-26505240",
        imageUrl: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&q=80"
    },
    {
        name: "Honest Restaurant",
        type: "restaurant",
        rating: 4.3,
        totalRatings: 280,
        area: "Ellis Bridge",
        address: "Ellis Bridge, Ahmedabad",
        coordinates: { latitude: 23.0225, longitude: 72.5714 },
        delivery: true,
        dine_in: true,
        cuisine: ["Gujarati", "Indian", "Vegetarian"],
        costForTwo: 600,
        deliveryTime: "35-50 mins",
        phone: "+91-79-26577666",
        imageUrl: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80"
    },
    {
        name: "Gopi Dining Hall",
        type: "restaurant",
        rating: 4.2,
        totalRatings: 195,
        area: "Khanpur",
        address: "Khanpur, Ahmedabad",
        coordinates: { latitude: 23.0225, longitude: 72.5714 },
        delivery: true,
        dine_in: true,
        cuisine: ["Gujarati", "Indian", "Vegetarian"],
        costForTwo: 300,
        deliveryTime: "25-40 mins",
        phone: "+91-79-25600000",
        imageUrl: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&q=80"
    },
    {
        name: "Manek Chowk",
        type: "restaurant",
        rating: 4.4,
        totalRatings: 520,
        area: "Manek Chowk",
        address: "Manek Chowk, Ahmedabad",
        coordinates: { latitude: 23.0258, longitude: 72.5873 },
        delivery: true,
        dine_in: true,
        cuisine: ["Street Food", "Gujarati", "Snacks"],
        costForTwo: 200,
        deliveryTime: "20-35 mins",
        phone: "+91-79-22140000",
        imageUrl: "https://images.unsplash.com/photo-1504674900152-b8b80e7ddb3d?w=800&q=80"
    },
    {
        name: "Shree Maruti Restaurant",
        type: "restaurant",
        rating: 4.1,
        totalRatings: 210,
        area: "Paldi",
        address: "Paldi, Ahmedabad",
        coordinates: { latitude: 23.0159, longitude: 72.5626 },
        delivery: true,
        dine_in: true,
        cuisine: ["Gujarati", "Indian", "Vegetarian"],
        costForTwo: 350,
        deliveryTime: "30-45 mins",
        phone: "+91-79-26640000",
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"
    },
    {
        name: "Thakkar Bhojanalay",
        type: "restaurant",
        rating: 4.0,
        totalRatings: 155,
        area: "Vastrapur",
        address: "Vastrapur, Ahmedabad",
        coordinates: { latitude: 23.0396, longitude: 72.5314 },
        delivery: true,
        dine_in: true,
        cuisine: ["Gujarati", "Indian", "Vegetarian"],
        costForTwo: 250,
        deliveryTime: "35-50 mins",
        phone: "+91-79-26740000",
        imageUrl: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&q=80"
    },
    {
        name: "Havmor Ice Cream",
        type: "restaurant",
        rating: 4.6,
        totalRatings: 480,
        area: "Maninagar",
        address: "Maninagar, Ahmedabad",
        coordinates: { latitude: 22.9908, longitude: 72.6045 },
        delivery: true,
        dine_in: true,
        cuisine: ["Ice Cream", "Desserts", "Beverages"],
        costForTwo: 300,
        deliveryTime: "25-40 mins",
        phone: "+91-79-25460000",
        imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e157?w=800&q=80"
    },
    {
        name: "KFC",
        type: "fast_food",
        rating: 4.2,
        totalRatings: 560,
        area: "CG Road",
        address: "CG Road, Ahmedabad",
        coordinates: { latitude: 23.0396, longitude: 72.5314 },
        delivery: true,
        dine_in: true,
        cuisine: ["Fast Food", "American", "Chicken"],
        costForTwo: 500,
        deliveryTime: "25-40 mins",
        phone: "+91-79-40040000",
        imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80"
    },
    {
        name: "McDonald's",
        type: "fast_food",
        rating: 4.1,
        totalRatings: 640,
        area: "Satellite",
        address: "Satellite, Ahmedabad",
        coordinates: { latitude: 23.0301, longitude: 72.5611 },
        delivery: true,
        dine_in: true,
        cuisine: ["Fast Food", "American", "Burgers"],
        costForTwo: 400,
        deliveryTime: "20-35 mins",
        phone: "+91-79-26920000",
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80"
    },
    {
        name: "Domino's Pizza",
        type: "fast_food",
        rating: 4.0,
        totalRatings: 720,
        area: "Navrangpura",
        address: "Navrangpura, Ahmedabad",
        coordinates: { latitude: 23.0365, longitude: 72.5612 },
        delivery: true,
        dine_in: false,
        cuisine: ["Pizza", "Italian", "Fast Food"],
        costForTwo: 400,
        deliveryTime: "25-40 mins",
        phone: "+91-79-26510000",
        imageUrl: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800&q=80"
    },
    {
        name: "Subway",
        type: "fast_food",
        rating: 4.3,
        totalRatings: 380,
        area: "Prahlad Nagar",
        address: "Prahlad Nagar, Ahmedabad",
        coordinates: { latitude: 23.0125, longitude: 72.5116 },
        delivery: true,
        dine_in: true,
        cuisine: ["Sandwiches", "American", "Healthy"],
        costForTwo: 350,
        deliveryTime: "30-45 mins",
        phone: "+91-79-29700000",
        imageUrl: "https://images.unsplash.com/photo-1528735602780-cf69f47c0aa4?w=800&q=80"
    },
    {
        name: "Starbucks",
        type: "cafe",
        rating: 4.4,
        totalRatings: 580,
        area: "SG Highway",
        address: "SG Highway, Ahmedabad",
        coordinates: { latitude: 23.0396, longitude: 72.5314 },
        delivery: true,
        dine_in: true,
        cuisine: ["Coffee", "Beverages", "Snacks"],
        costForTwo: 600,
        deliveryTime: "20-35 mins",
        phone: "+91-79-29710000",
        imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80"
    },
    {
        name: "CCD (Cafe Coffee Day)",
        type: "cafe",
        rating: 4.1,
        totalRatings: 310,
        area: "Ellis Bridge",
        address: "Ellis Bridge, Ahmedabad",
        coordinates: { latitude: 23.0225, longitude: 72.5714 },
        delivery: true,
        dine_in: true,
        cuisine: ["Coffee", "Beverages", "Snacks"],
        costForTwo: 400,
        deliveryTime: "15-30 mins",
        phone: "+91-79-26580000",
        imageUrl: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80"
    },
    {
        name: "The Belgian Waffle Co.",
        type: "cafe",
        rating: 4.5,
        totalRatings: 420,
        area: "Bodakdev",
        address: "Bodakdev, Ahmedabad",
        coordinates: { latitude: 23.0402, longitude: 72.5123 },
        delivery: true,
        dine_in: true,
        cuisine: ["Desserts", "Belgian", "Waffles"],
        costForTwo: 500,
        deliveryTime: "25-40 mins",
        phone: "+91-79-29720000",
        imageUrl: "https://images.unsplash.com/photo-1578502494516-c3416ca7bee0?w=800&q=80"
    },
    {
        name: "Baskin Robbins",
        type: "restaurant",
        rating: 4.2,
        totalRatings: 355,
        area: "Drive In Road",
        address: "Drive In Road, Ahmedabad",
        coordinates: { latitude: 23.0258, longitude: 72.5873 },
        delivery: true,
        dine_in: true,
        cuisine: ["Ice Cream", "Desserts", "American"],
        costForTwo: 300,
        deliveryTime: "20-35 mins",
        phone: "+91-79-26400000",
        imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e157?w=800&q=80"
    }
];

async function seedRealRestaurants() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/flavorfinder';
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB connected successfully');

        // Find or create default owner
        let defaultOwner = await User.findOne({ email: 'owner@flavorfinder.local' });
        if (!defaultOwner) {
            console.log('👤 Creating default restaurant owner...');
            defaultOwner = new User({
                name: 'Default Restaurant Owner',
                email: 'owner@flavorfinder.local',
                phone: '+919876543210',
                password: 'owner123',
                role: 'restaurant_owner',
                address: {
                    street: 'Default Street',
                    city: 'Ahmedabad',
                    state: 'Gujarat',
                    zipCode: '380001'
                }
            });
            await defaultOwner.save();
            console.log('✅ Default restaurant owner created');
        } else {
            console.log('✅ Using existing restaurant owner');
        }

        // Check existing restaurants
        const existingCount = await Restaurant.countDocuments({ isActive: true });
        if (existingCount > 2) {
            console.log(`⚠️ Found ${existingCount} existing active restaurants. Skipping duplicate insertion.`);
            console.log('💡 Tip: Delete collections in MongoDB if you want fresh data seeding.');
        } else {
            // Insert restaurants
            console.log('🍽️ Seeding 16 real Ahmedabad restaurants...');
            const restaurantsToInsert = realAhmedabadRestaurants.map(restaurantData => ({
                ...restaurantData,
                owner: defaultOwner._id,
                address: {
                    street: restaurantData.address,
                    area: restaurantData.area,
                    city: 'Ahmedabad',
                    state: 'Gujarat',
                    zipCode: '380001',
                    coordinates: restaurantData.coordinates
                },
                isActive: true,
                isOpen: true,
                deliveryFee: 40,
                minimumOrder: 0,
                categories: [restaurantData.type],
                openingHours: {
                    monday: { open: '10:00', close: '23:00' },
                    tuesday: { open: '10:00', close: '23:00' },
                    wednesday: { open: '10:00', close: '23:00' },
                    thursday: { open: '10:00', close: '23:00' },
                    friday: { open: '10:00', close: '23:30' },
                    saturday: { open: '09:00', close: '23:30' },
                    sunday: { open: '09:00', close: '23:00' }
                }
            }));

            const insertedRestaurants = await Restaurant.insertMany(restaurantsToInsert);
            console.log(`✅ Successfully inserted ${insertedRestaurants.length} restaurants into database`);
        }

        // Display summary
        const totalRestaurants = await Restaurant.countDocuments({ isActive: true });
        const restaurants = await Restaurant.find({ isActive: true }).select('name type delivery dine_in area');

        console.log('\n📊 Database Summary:');
        console.log(`📍 Total Active Restaurants: ${totalRestaurants}`);
        console.log('\n🏪 Restaurants by Type:');
        const byType = restaurants.reduce((acc, r) => {
            acc[r.type] = (acc[r.type] || 0) + 1;
            return acc;
        }, {});
        Object.entries(byType).forEach(([type, count]) => {
            console.log(`   ${type}: ${count}`);
        });

        console.log('\n✨ Restaurants in Database:');
        restaurants.forEach((r, i) => {
            const services = [];
            if (r.delivery) services.push('🚗 Delivery');
            if (r.dine_in) services.push('🍽️ Dine-in');
            console.log(`${i + 1}. ${r.name} (${r.type}) - ${r.area} - ${services.join(', ')}`);
        });

        console.log('\n✅ Database seeding completed successfully!');
        console.log('🌐 Start the server to see changes on the website');

        await mongoose.disconnect();
        console.log('📪 Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding restaurants:', error);
        process.exit(1);
    }
}

// Run the seed function
seedRealRestaurants();