import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * SMS OTP Service
 * 
 * Supports multiple providers:
 * 1. Fast2SMS (Fast, India-friendly)
 * 2. Twilio (Global, professional)
 * 
 * Setup Instructions for Fast2SMS:
 * 1. Go to https://www.fast2sms.com/
 * 2. Sign up (free trial available)
 * 3. Get API key from dashboard
 * 4. Add to .env:
 *    SMS_SERVICE=fast2sms
 *    FAST2SMS_API_KEY=your-api-key
 * 
 * Setup for Twilio:
 * 1. Go to https://www.twilio.com/
 * 2. Sign up (free trial with credits)
 * 3. Get Account SID, Auth Token, and Phone Number
 * 4. Add to .env:
 *    SMS_SERVICE=twilio
 *    TWILIO_ACCOUNT_SID=your-sid
 *    TWILIO_AUTH_TOKEN=your-token
 *    TWILIO_PHONE=+1234567890
 */

/**
 * Send SMS OTP using Fast2SMS
 */
export const sendFast2SMS = async(phone, otp) => {
    try {
        const apiKey = process.env.FAST2SMS_API_KEY;

        if (!apiKey) {
            console.log('⚠️  Fast2SMS API key not configured');
            return { success: false, message: 'SMS service not configured' };
        }

        // Format phone number (add +91 for India if not present)
        let formattedPhone = phone;
        if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+91' + formattedPhone.replace(/^\+91/, '');
        }

        const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
            params: {
                authorization: apiKey,
                variables_values: otp,
                route: 'otp',
                numbers: formattedPhone.replace('+', '')
            }
        });

        if (response.data.return) {
            console.log(`✅ SMS OTP sent to: ${phone}`);
            return { success: true, message: 'OTP sent via SMS' };
        } else {
            console.error('❌ Fast2SMS error:', response.data);
            return { success: false, message: 'Failed to send SMS' };
        }

    } catch (error) {
        console.error('❌ Fast2SMS error:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Send SMS OTP using Twilio
 */
export const sendTwilioSMS = async(phone, otp) => {
    try {
        const accountSid = process.env.TWILIO_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromPhone = process.env.TWILIO_PHONE;

        if (!accountSid || !authToken || !fromPhone) {
            console.log('⚠️  Twilio credentials not configured');
            return { success: false, message: 'Twilio service not configured' };
        }

        const message = `Your FlavourFinder OTP is: ${otp}. Valid for 5 minutes.`;
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

        const response = await axios.post(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            new URLSearchParams({
                From: fromPhone,
                To: phone,
                Body: message
            }), {
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        console.log(`✅ SMS OTP sent to: ${phone}`);
        return { success: true, message: 'OTP sent via SMS' };

    } catch (error) {
        console.error('❌ Twilio error:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Main function to send SMS OTP
 * Automatically selects provider based on .env configuration
 */
export const sendSmsOTP = async(phone, otp) => {
    try {
        const smsService = process.env.SMS_SERVICE || 'twilio';

        if (smsService === 'twilio') {
            return await sendTwilioSMS(phone, otp);
        } else if (smsService === 'fast2sms') {
            return await sendFast2SMS(phone, otp);
        } else {
            console.log('⚠️  Unknown SMS service:', smsService);
            return { success: false, message: 'SMS service not configured' };
        }

    } catch (error) {
        console.error('❌ SMS OTP error:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Development mode: Show OTP on console
 */
export const logOtpConsole = (phone, email, otp) => {
    console.log('\n' + '='.repeat(60));
    console.log('🔐 OTP GENERATED (DEVELOPMENT MODE)');
    console.log('='.repeat(60));
    if (email) console.log(`📧 Email: ${email}`);
    if (phone) console.log(`📱 Phone: ${phone}`);
    console.log(`🔑 OTP CODE: ${otp}`);
    console.log('⏰ Expires in: 5 minutes');
    console.log('='.repeat(60) + '\n');
};