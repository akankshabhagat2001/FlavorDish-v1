import axios from 'axios';
const API_URL = 'http://localhost:5001/api';

async function createTestUsers() {
    const testUsers = [
        { name: 'Admin User', email: 'admin@demo.local', password: 'admin123', role: 'admin' },
        { name: 'Customer User', email: 'customer@demo.local', password: 'customer123', role: 'customer' },
        { name: 'Restaurant Owner', email: 'owner@demo.local', password: 'owner123', role: 'restaurant_owner' },
        { name: 'Delivery Partner', email: 'delivery@demo.local', password: 'delivery123', role: 'delivery_partner' },
        { name: 'Dinner Demo', email: 'dinner@demo.local', password: 'dinner123', role: 'customer' }
    ];

    console.log('🚀 Creating test users...\n');

    for (const user of testUsers) {
        try {
            const response = await axios.post(`${API_URL}/auth/register`, user);
            console.log(`✅ Created: ${user.email}`);
        } catch (error) {
            if (error.response?.status === 409 || error.message.includes('duplicate')) {
                console.log(`⏭️  Already exists: ${user.email}`);
            } else {
                console.log(`⚠️  ${user.email}: ${error.response?.data?.message || error.message}`);
            }
        }
    }

    console.log('\n🎉 Test users setup complete!\n');
    console.log('📋 TEST CREDENTIALS:');
    console.log('─'.repeat(50));
    testUsers.forEach(u => {
        console.log(`Email: ${u.email} | Password: ${u.password}`);
    });
    console.log('─'.repeat(50));
}

createTestUsers().then(() => process.exit(0)).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});