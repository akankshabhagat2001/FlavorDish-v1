#!/usr/bin/env node

/**
 * Test Registration & Admin Login
 */

const API = 'http://localhost:5001/api';
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║         REGISTRATION TEST & ADMIN LOGIN GUIDE              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
// Test 1: Register a new user
async function testRegister() {
    console.log('📝 TEST 1: Registering New User');
    console.log('─────────────────────────────────────────────────────────\n');

    const newUserData = {
        name: 'Test Customer',
        email: 'testcustomer@demo.local',
        phone: '+919999999999',
        address: 'Test Address, City',
        password: 'password123',
        role: 'customer'
    };
    try {
        const response = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUserData)
        });
        const data = await response.json();

        if (!response.ok) {
            console.log(`❌ REGISTRATION FAILED:`);
            console.log(`   Error: ${data.message}`);
            console.log(`   Status: ${response.status}\n`);
            return false;
        }

        console.log(`✅ REGISTRATION SUCCESSFUL!`);
        console.log(`   Email: ${newUserData.email}`);
        console.log(`   Password: ${newUserData.password}`);
        console.log(`   Role: ${newUserData.role}`);
        console.log(`   Message: ${data.message}\n`);
        return true;

    } catch (error) {
        console.log(`❌ Request failed: ${error.message}\n`);
        return false;
    }
}

// Test 2: Admin Login
async function testAdminLogin() {
    console.log('👨‍💼 TEST 2: Admin Login');
    console.log('─────────────────────────────────────────────────────────\n');

    const adminCredentials = {
        email: 'admin@demo.local',
        password: 'admin123'
    };

    try {
        const response = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminCredentials)
        });

        const data = await response.json();

        if (!response.ok) {
            console.log(`❌ ADMIN LOGIN FAILED:`);
            console.log(`   Error: ${data.message}`);
            console.log(`   Status: ${response.status}\n`);
            return false;
        }

        console.log(`✅ ADMIN LOGIN SUCCESSFUL!`);
        console.log(`   Email: ${adminCredentials.email}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   OTP Required: ${data.otpRequired ? 'YES' : 'NO'}`);
        console.log(`\n   📧 Check backend console for OTP code!\n`);
        return true;

    } catch (error) {
        console.log(`❌ Request failed: ${error.message}\n`);
        return false;
    }
}

// Test 3: List all test credentials
async function showTestCredentials() {
    console.log('🔐 ALL TEST CREDENTIALS');
    console.log('─────────────────────────────────────────────────────────\n');

    const credentials = [
        { email: 'admin@demo.local', password: 'admin123', role: 'Administrator' },
        { email: 'customer@demo.local', password: 'customer123', role: 'Customer' },
        { email: 'restaurant@demo.local', password: 'restaurant123', role: 'Restaurant Owner' },
        { email: 'driver@demo.local', password: 'driver123', role: 'Delivery Partner' }
    ];

    credentials.forEach((cred, i) => {
        console.log(`${i + 1}. ${cred.role.toUpperCase()}`);
        console.log(`   📧 Email: ${cred.email}`);
        console.log(`   🔑 Password: ${cred.password}`);
        console.log(`   → Click "Log in" and enter these credentials\n`);
    });
}

// Run all tests
async function runTests() {
    const regSuccess = await testRegister();
    const adminSuccess = await testAdminLogin();

    showTestCredentials();

    console.log('═════════════════════════════════════════════════════════════');
    console.log('✅ TEST COMPLETE\n');

    if (regSuccess && adminSuccess) {
        console.log('🎉 Both registration and login are working!\n');
    } else {
        console.log('⚠️  Some tests failed. Check backend logs.\n');
    }

    process.exit(0);
}

runTests();