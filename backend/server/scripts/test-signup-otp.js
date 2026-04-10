#!/usr/bin/env node

/**
 * Test script to verify signup and OTP flow
 * Run: node test-signup-otp.js
 */

const API_URL = 'http://localhost:5001';

async function testSignup() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🧪 TESTING SIGNUP AND OTP FLOW');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Test data for new user
    const testEmail = `testuser_${Date.now()}@demo.local`;
    const testData = {
        name: 'Test User',
        email: testEmail,
        phone: '+919999999999',
        address: '123 Test Street',
        password: 'testpass123',
        role: 'customer'
    };

    try {
        // Step 1: Test Signup
        console.log('📝 STEP 1: Testing User Signup');
        console.log('─────────────────────────────────────────────────────────');
        console.log('Sending registration request with:');
        console.log(`  ✓ Email: ${testData.email}`);
        console.log(`  ✓ Role: ${testData.role}`);
        console.log(`  ✓ Password: ${testData.password}`);

        const signupResponse = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });

        const signupData = await signupResponse.json();

        if (!signupResponse.ok) {
            console.log(`\n❌ SIGNUP FAILED: ${signupData.message}`);
            console.log('Response:', JSON.stringify(signupData, null, 2));
            return;
        }

        console.log(`\n✅ SIGNUP SUCCESSFUL!`);
        console.log(`   Message: ${signupData.message}`);
        console.log(`   Token received: ${signupData.token ? '✓' : '✗'}\n`);
        // Step 2: Test Login (without OTP verification yet)
        console.log('📝 STEP 2: Testing User Login (OTP Generation)');
        console.log('─────────────────────────────────────────────────────────');
        console.log(`Attempting login with email: ${testData.email}`);
        const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testData.email,
                password: testData.password
            })
        });

        const loginData = await loginResponse.json();

        if (!loginResponse.ok) {
            console.log(`\n❌ LOGIN FAILED: ${loginData.message}`);
            return;
        }

        console.log(`\n✅ LOGIN SUCCESSFUL!`);
        console.log(`   Message: ${loginData.message}`);
        console.log(`   OTP Required: ${loginData.otpRequired ? 'YES ✓' : 'NO'}`);
        console.log(`   Email: ${loginData.email}`);
        console.log(`   Phone: ${loginData.phone}`);
        console.log(`\n   ⚠️  CHECK BACKEND CONSOLE for OTP code!\n`);

        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ SIGNUP AND OTP GENERATION TEST COMPLETE');
        console.log('═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

testSignup();