import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from './models/Restaurant.js';
import Food from './models/Food.js';

dotenv.config();

const menuGenerators = {
    pizza: [
        { name: 'Margherita Pizza', basePrice: 200, category: 'Main Course', desc: 'Classic cheese and tomato sauce' },
        { name: 'Farmhouse Pizza', basePrice: 350, category: 'Main Course', desc: 'Loaded with capsicum, onion, tomato and mushroom' },
        { name: 'Garlic Breadstix', basePrice: 120, category: 'Starters', desc: 'Freshly baked garlic bread' },
        { name: 'Choco Lava Cake', basePrice: 110, category: 'Desserts', desc: 'Chocolate cake with a gooey center' }
    ],
    cafe: [
        { name: 'Cappuccino', basePrice: 180, category: 'Beverages', desc: 'Classic Italian coffee espresso with steamed milk' },
        { name: 'Iced Latte', basePrice: 200, category: 'Beverages', desc: 'Chilled espresso and milk over ice' },
        { name: 'Blueberry Muffin', basePrice: 150, category: 'Snacks', desc: 'Freshly baked muffin loaded with blueberries' },
        { name: 'Grilled Sandwich', basePrice: 250, category: 'Snacks', desc: 'Toasted sandwich with cheese and veggies' }
    ],
    burger: [
        { name: 'Classic Veg Burger', basePrice: 150, category: 'Main Course', desc: 'Crispy veggie patty with fresh lettuce and mayo' },
        { name: 'Cheese Burst Burger', basePrice: 220, category: 'Main Course', desc: 'Loaded with cheese inside and out' },
        { name: 'French Fries', basePrice: 100, category: 'Starters', desc: 'Crispy golden fries' },
        { name: 'Coke Float', basePrice: 120, category: 'Beverages', desc: 'Cold beverage with vanilla ice cream' }
    ],
    gujarati: [
        { name: 'Gujarati Thali Unlimited', basePrice: 400, category: 'Main Course', desc: 'Authentic flavors including Roti, Sabzi, Dal, Rice, Farsan and Sweet' },
        { name: 'Khaman Dhokla', basePrice: 80, category: 'Starters', desc: 'Soft and spongy steamed savory cake' },
        { name: 'Handvo', basePrice: 150, category: 'Starters', desc: 'Savory vegetable cake made from lentils and rice' },
        { name: 'Aamras (Seasonal)', basePrice: 120, category: 'Desserts', desc: 'Sweet mango pulp' }
    ],
    ice_cream: [
        { name: 'Vanilla Bean Scoop', basePrice: 90, category: 'Desserts', desc: 'Classic real vanilla bean' },
        { name: 'Belgian Chocolate', basePrice: 150, category: 'Desserts', desc: 'Rich and dark chocolate ice cream' },
        { name: 'Almond Carnival', basePrice: 180, category: 'Desserts', desc: 'Loaded with roasted almonds and caramel' },
        { name: 'Thick Cold Coffee', basePrice: 160, category: 'Beverages', desc: 'Thick and creamy coffee shake' }
    ],
    generic_indian: [
        { name: 'Paneer Butter Masala', basePrice: 280, category: 'Main Course', desc: 'Cottage cheese cubes in a rich tomato gravy' },
        { name: 'Dal Makhani', basePrice: 220, category: 'Main Course', desc: 'Slow cooked black lentils with cream and butter' },
        { name: 'Butter Naan', basePrice: 50, category: 'Breads', desc: 'Soft Indian bread cooked in tandoor' },
        { name: 'Gulab Jamun', basePrice: 80, category: 'Desserts', desc: 'Deep fried milk solids soaked in sugar syrup' }
    ]
};

const determineMenuType = (restaurantName, cuisineArray) => {
    const name = restaurantName.toLowerCase();
    const cuisines = cuisineArray.map(c => c.toLowerCase());
    
    if (name.includes('pizza') || cuisines.includes('pizza')) return 'pizza';
    if (name.includes('cafe') || name.includes('coffee') || name.includes('starbucks')) return 'cafe';
    if (name.includes('mcdonald') || name.includes('kfc') || name.includes('burger') || cuisines.includes('fast food')) return 'burger';
    if (name.includes('agashiye') || name.includes('gopi') || cuisines.includes('gujarati')) return 'gujarati';
    if (name.includes('ice cream') || name.includes('baskin') || cuisines.includes('ice cream') || cuisines.includes('desserts')) return 'ice_cream';
    return 'generic_indian';
};

async function seedMenus() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/flavorfinder';
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB connected');

        // Clean up previous foods first so we don't duplicate forever
        await Food.deleteMany({});
        console.log('🧹 Cleared existing food items.');

        const restaurants = await Restaurant.find({ isActive: true });
        console.log(`🔍 Found ${restaurants.length} active restaurants. Building menus...`);

        const allFoodsToInsert = [];

        for (const restaurant of restaurants) {
            const menuType = determineMenuType(restaurant.name, restaurant.cuisine);
            const menuTemplates = menuGenerators[menuType];

            // Generate items
            for (const item of menuTemplates) {
                // Add some random price variation (+- 10%)
                const priceVariation = 1 + (Math.random() * 0.2 - 0.1); 
                const finalPrice = Math.round(item.basePrice * priceVariation);
                const isVeg = menuType !== 'burger' && menuType !== 'pizza' ? true : Math.random() > 0.3;

                allFoodsToInsert.push({
                    name: item.name,
                    description: item.desc,
                    price: finalPrice,
                    category: item.category,
                    subcategory: item.category,
                    restaurant: restaurant._id,
                    images: [{ url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500', alt: item.name }],
                    isVeg: isVeg,
                    isAvailable: true,
                    preparationTime: Math.floor(Math.random() * 15) + 10, // 10 to 25 mins
                    rating: (Math.random() * 1 + 3.8).toFixed(1), // 3.8 to 4.8
                    totalRatings: Math.floor(Math.random() * 200) + 10
                });
            }
        }

        if (allFoodsToInsert.length > 0) {
            await Food.insertMany(allFoodsToInsert);
            console.log(`🎉 Successfully inserted ${allFoodsToInsert.length} food items across ${restaurants.length} restaurants!`);
        } else {
            console.log('⚠️ No foods were generated.');
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding foods:', err);
        process.exit(1);
    }
}

seedMenus();
