import fetch from 'node-fetch';

async function testLogin() {
    try {
        console.log('🧪 Testing authentication with customer@demo.local...\n');
        const response = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'customer@demo.local',
                password: 'customer123'
            })
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Data:');
        console.log(JSON.stringify(data, null, 2));
        if (response.ok) {
            console.log('\n✅ Login successful!');
            console.log('Check backend console for OTP...\n');
        } else {
            console.log('\n❌ Login failed');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testLogin();