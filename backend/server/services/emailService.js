import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Universal Email OTP Service
 * Supports: Gmail (with App Password) → Ethereal (free, no setup)
 */

let etherealTestAccount = null;

// Get or create Ethereal test account (free, no setup needed)
const getEtherealTransporter = async() => {
    try {
        if (!etherealTestAccount) {
            etherealTestAccount = await nodemailer.createTestAccount();
        }

        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: etherealTestAccount.user,
                pass: etherealTestAccount.pass
            }
        });
    } catch (error) {
        console.error('Ethereal setup error:', error.message);
        return null;
    }
};

// Get Gmail transporter
const getGmailTransporter = () => {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });
};

export const sendEmailOTP = async(email, otp, name = 'User') => {
    try {
        let transporter = null;
        let senderEmail = 'noreply@flavorfinder.local';

        // Try Gmail first
        transporter = getGmailTransporter();
        if (transporter) {
            senderEmail = process.env.GMAIL_USER;
            console.log('📧 Using Gmail for OTP email');
        } else {
            // Fall back to Ethereal (free, no setup)
            transporter = await getEtherealTransporter();
            if (transporter && etherealTestAccount) {
                senderEmail = etherealTestAccount.user;
                console.log('📧 Using Ethereal Email for OTP (free, instant delivery)');
            }
        }

        if (!transporter) {
            console.log('⚠️  Email service not available. OTP shown in console.');
            return { success: false, message: 'Email service not configured' };
        }

        const mailOptions = {
            from: senderEmail,
            to: email,
            subject: '🔐 FlavourFinder - Your OTP Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px; border-radius: 10px;">
                    <div style="background: linear-gradient(135deg, #EF4F5F 0%, #d63447 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h2 style="color: white; margin: 0; font-size: 28px;">🍕 FlavourFinder</h2>
                    </div>
                    
                    <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; text-align: center;">
                        <h3 style="color: #333; margin-top: 0;">Hello ${name},</h3>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            Your One-Time Password for login/signup is:
                        </p>
                        
                        <div style="background: linear-gradient(135deg, #EF4F5F 0%, #d63447 100%); border-radius: 10px; padding: 25px; margin: 20px 0;">
                            <h1 style="color: white; letter-spacing: 8px; margin: 0; font-size: 48px;">${otp}</h1>
                        </div>

                        <p style="color: #999; font-size: 14px;">
                            ⏰ Valid for 5 minutes
                        </p>

                        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; text-align: left;">
                            <p style="margin: 0; color: #856404; font-size: 13px;">
                                <strong>🔒 Security:</strong> Never share this code. FlavourFinder never asks for OTP via email.
                            </p>
                        </div>

                        <p style="color: #666; font-size: 13px; margin-top: 30px;">
                            If you didn't request this, please ignore this email.
                        </p>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                        <p style="margin: 0;">© 2026 FlavourFinder. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ OTP email sent to: ${email}`);

        // If using Ethereal, log preview URL
        if (!process.env.GMAIL_USER && etherealTestAccount) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log(`\n📧 Email Preview URL: ${previewUrl}\n`);
            }
        }

        return { success: true, message: 'OTP sent to email' };

    } catch (error) {
        console.error('❌ Email send failed:', error.message);
        console.error('Full error details:', error);
        console.error('Error stack:', error.stack);
        return { success: false, message: error.message };
    }
};

/**
 * Send Plain Text Email OTP (fallback)
 */
export const sendPlainEmailOTP = async(email, otp) => {
    try {
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            console.log('⚠️  Email service not configured');
            return { success: false };
        }

        const transporter = createTransporter();

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Your FlavourFinder OTP',
            text: `Your OTP is: ${otp}\n\nThis OTP will expire in 5 minutes.`
        });

        return { success: true };
    } catch (error) {
        console.error('Email error:', error.message);
        return { success: false };
    }
};

/**
 * Send Welcome Email after successful registration
 */
export const sendWelcomeEmail = async(email, name = 'User') => {
    try {
        let transporter = null;
        let senderEmail = 'noreply@flavorfinder.local';

        transporter = getGmailTransporter();
        if (transporter) {
            senderEmail = process.env.GMAIL_USER;
        } else {
            transporter = await getEtherealTransporter();
            if (transporter && etherealTestAccount) {
                senderEmail = etherealTestAccount.user;
            }
        }

        if (!transporter) {
            console.log('⚠️  Email service not available.');
            return { success: false };
        }

        const mailOptions = {
            from: senderEmail,
            to: email,
            subject: '👋 Welcome to FlavourFinder!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px; border-radius: 10px;">
                    <div style="background: linear-gradient(135deg, #EF4F5F 0%, #d63447 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h2 style="color: white; margin: 0; font-size: 28px;">🍕 FlavourFinder</h2>
                    </div>
                    
                    <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; text-align: center;">
                        <h3 style="color: #333; margin-top: 0;">Welcome ${name}!</h3>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            Thank you for joining FlavourFinder. We're excited to have you on board!
                        </p>

                        <div style="background: #f0f0f0; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: left;">
                            <h4 style="color: #333; margin-top: 0;">🎉 What's Next?</h4>
                            <ul style="color: #666; line-height: 1.8;">
                                <li>Explore amazing restaurants in your area</li>
                                <li>Order delicious food and get it delivered</li>
                                <li>Track your orders in real-time</li>
                                <li>Earn rewards with every order</li>
                            </ul>
                        </div>

                        <p style="color: #666; font-size: 13px; margin-top: 30px;">
                            If you have any questions, feel free to reach out to our support team.
                        </p>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                        <p style="margin: 0;">© 2026 FlavourFinder. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Welcome email sent to: ${email}`);
        return { success: true };

    } catch (error) {
        console.error('❌ Welcome email failed:', error.message);
        return { success: false };
    }
};

/**
 * Send Order Confirmation Email
 */
export const sendOrderConfirmationEmail = async(email, name = 'User', orderDetails = {}) => {
    try {
        let transporter = null;
        let senderEmail = 'noreply@flavorfinder.local';

        transporter = getGmailTransporter();
        if (transporter) {
            senderEmail = process.env.GMAIL_USER;
        } else {
            transporter = await getEtherealTransporter();
            if (transporter && etherealTestAccount) {
                senderEmail = etherealTestAccount.user;
            }
        }

        if (!transporter) {
            console.log('⚠️  Email service not available.');
            return { success: false };
        }

        const { orderId, total, restaurant, estimatedTime } = orderDetails;

        const mailOptions = {
            from: senderEmail,
            to: email,
            subject: '✅ Order Confirmed - FlavourFinder',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px; border-radius: 10px;">
                    <div style="background: linear-gradient(135deg, #EF4F5F 0%, #d63447 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h2 style="color: white; margin: 0; font-size: 28px;">🍕 FlavourFinder</h2>
                    </div>
                    
                    <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; text-align: left;">
                        <h3 style="color: #333; margin-top: 0;">✅ Your Order is Confirmed!</h3>
                        
                        <div style="background: #f0f0f0; border-radius: 10px; padding: 20px; margin: 20px 0;">
                            <p style="color: #666; margin: 0;"><strong>Order ID:</strong> ${orderId || 'N/A'}</p>
                            <p style="color: #666; margin: 10px 0;"><strong>Restaurant:</strong> ${restaurant || 'N/A'}</p>
                            <p style="color: #666; margin: 10px 0;"><strong>Total Amount:</strong> ₹${total || 0}</p>
                            <p style="color: #666; margin: 10px 0;"><strong>Estimated Delivery:</strong> ${estimatedTime || '30-40 mins'}</p>
                        </div>

                        <p style="color: #666; font-size: 14px;">
                            Your order is being prepared. You can track your delivery in real-time using our app.
                        </p>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                        <p style="margin: 0;">© 2026 FlavourFinder. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Order confirmation email sent to: ${email}`);
        return { success: true };

    } catch (error) {
        console.error('❌ Order confirmation email failed:', error.message);
        return { success: false };
    }
};

/**
 * Send Password Reset Email with OTP
 */
export const sendPasswordResetEmail = async(email, otp, name = 'User') => {
    try {
        let transporter = null;
        let senderEmail = 'noreply@flavorfinder.local';

        transporter = getGmailTransporter();
        if (transporter) {
            senderEmail = process.env.GMAIL_USER;
        } else {
            transporter = await getEtherealTransporter();
            if (transporter && etherealTestAccount) {
                senderEmail = etherealTestAccount.user;
            }
        }

        if (!transporter) {
            console.log('⚠️  Email service not available.');
            return { success: false };
        }

        const mailOptions = {
            from: senderEmail,
            to: email,
            subject: '🔐 Password Reset Request - FlavourFinder',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px; border-radius: 10px;">
                    <div style="background: linear-gradient(135deg, #EF4F5F 0%, #d63447 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h2 style="color: white; margin: 0; font-size: 28px;">🍕 FlavourFinder</h2>
                    </div>
                    
                    <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; text-align: center;">
                        <h3 style="color: #333; margin-top: 0;">Password Reset Request</h3>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            We received a request to reset your password. Use the OTP below to proceed:
                        </p>
                        
                        <div style="background: linear-gradient(135deg, #EF4F5F 0%, #d63447 100%); border-radius: 10px; padding: 25px; margin: 20px 0;">
                            <h1 style="color: white; letter-spacing: 8px; margin: 0; font-size: 48px;">${otp}</h1>
                        </div>

                        <p style="color: #999; font-size: 14px;">
                            ⏰ This OTP is valid for 10 minutes
                        </p>

                        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; text-align: left;">
                            <p style="margin: 0; color: #856404; font-size: 13px;">
                                <strong>🔒 Security:</strong> Never share this code with anyone. If you didn't request this, please ignore this email.
                            </p>
                        </div>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                        <p style="margin: 0;">© 2026 FlavourFinder. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent to: ${email}`);
        return { success: true };

    } catch (error) {
        console.error('❌ Password reset email failed:', error.message);
        return { success: false };
    }
};