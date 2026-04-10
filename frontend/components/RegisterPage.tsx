import React, { useState } from 'react';
import { authService } from '../services/authService';

interface RegisterPageProps {
  onSuccess?: (user?: any) => void;
  onLoginClick?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSuccess, onLoginClick }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
    restaurantName: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<'register' | 'email-verify'>('register');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Address is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.role === 'restaurant_owner' && !formData.restaurantName?.trim()) {
      setError('Restaurant Name is required for restaurant partners');
      return false;
    }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      console.warn('Form validation failed:', error);
      return;
    }

    setLoading(true);
    console.log('📝 Starting registration...');
    
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        password: formData.password,
        role: formData.role,
        restaurantName: formData.role === 'restaurant_owner' ? formData.restaurantName.trim() : undefined
      };

      console.log('Sending registration request:', {
        ...payload,
        password: '***'
      });

      const response = await authService.register(payload);

      console.log('✅ Registration response:', response);

      // Check if registration was successful with immediate token
      if (response.token && response.user) {
        // Store token and user data
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Show success message
        const successMessage = response.restaurant 
          ? '✅ Registration successful! Your restaurant has been created. Welcome to FlavorFinder!'
          : '✅ Registration successful! Welcome to FlavorFinder!';
        
        setSuccess(successMessage);
        
        // Redirect to appropriate dashboard after 2 seconds
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(response.user);
          }
        }, 2000);
        
        return;
      }

      // Fallback to OTP verification if no immediate token
      setRegisteredEmail(formData.email.trim().toLowerCase());
      setStep('email-verify');
      setSuccess('✅ Account created! Please verify your email to complete registration.');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
      
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      
      const errorMsg = err.response?.data?.message || 
                       err.response?.data?.error || 
                       err.message || 
                       'Registration failed. Please try again.';
      
      setError(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    setError('');
    setOtpLoading(true);

    try {
      await authService.requestEmailOtp(registeredEmail);
      setSuccess('✅ OTP sent to your email! Check your inbox.');
    } catch (err: any) {
      console.error('❌ OTP request error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to send OTP';
      setError(`❌ ${errorMsg}`);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp.trim()) {
      setError('❌ Please enter the OTP');
      return;
    }

    setOtpLoading(true);

    try {
      const response = await authService.verifyEmailOtp(registeredEmail, otp);
      
      setSuccess('✅ Email verified successfully! Redirecting to login...');
      
      // Clear form and reset
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: '',
        role: 'customer',
        restaurantName: ''
      });
      setOtp('');
      setStep('register');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        if (onLoginClick) {
          console.log('Redirecting to login...');
          onLoginClick();
        }
      }, 2000);
      
    } catch (err: any) {
      console.error('❌ OTP verification error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Invalid OTP';
      setError(`❌ ${errorMsg}`);
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">FlavourFinder</h1>
          <p className="text-gray-400">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
              {success}
            </div>
          )}

          {step === 'register' ? (
            /* First fragment - Registration Form */
            <>
            <form onSubmit={handleRegister} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">👤</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">✉️</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">📱</span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">📍</span>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St, Ahmedabad"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Register as</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              >
                <option value="customer">Customer</option>
                <option value="restaurant_owner">Restaurant Owner</option>
                <option value="delivery_partner">Delivery Partner</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Restaurant Name - Only show if role is restaurant_owner */}
            {formData.role === 'restaurant_owner' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Restaurant Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">🏪</span>
                  <input
                    type="text"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    placeholder="E.g., Spice Garden"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-400 text-lg"
                >
                  {showPassword ? '👁️‍🗨️' : '🙈'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">🔒</span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-400 text-lg"
                >
                  {showConfirmPassword ? '👁️‍🗨️' : '🙈'}
                </button>
              </div>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span className="inline-flex items-center justify-center">
                {loading && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>}
                {loading ? 'Creating account...' : 'Register'}
              </span>
            </button>
          </form>

          {/* Already have account */}
          <div className="mt-6 text-center text-gray-400 text-sm">
            Already have an account?{' '}
            <button
              onClick={onLoginClick}
              className="text-red-500 hover:text-red-400 font-semibold transition-colors"
            >
              Login here
            </button>
          </div>
            </>
          ) : (
            /* Second fragment - Email Verification */
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
                <p className="text-gray-400 text-sm">Enter the OTP sent to {registeredEmail}</p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {/* OTP Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">One-Time Password (OTP)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">🔐</span>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-center text-2xl tracking-widest"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Check your email for the 6-digit code. Valid for 5 minutes.</p>
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={otpLoading || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span className="inline-flex items-center justify-center">
                    {otpLoading && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>}
                    {otpLoading ? 'Verifying...' : 'Verify Email'}
                  </span>
                </button>

                {/* Resend OTP Button */}
                <button
                  type="button"
                  disabled={otpLoading}
                  onClick={handleRequestOtp}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpLoading ? 'Sending...' : 'Resend OTP'}
                </button>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => {
                    setStep('register');
                    setOtp('');
                    setError('');
                    setSuccess('');
                  }}
                  className="w-full text-gray-400 hover:text-gray-300 font-semibold py-2 rounded-lg transition-colors"
                >
                  Back to Registration
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
