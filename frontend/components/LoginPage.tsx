
import React, { useState } from 'react';
import { UserType, AppViewState } from '../types';
import { gpsLocationService } from '../services/gpsLocationService';
import { authService } from '../services';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
  onGoBack: () => void;
  onViewChange: (view: AppViewState) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onGoBack, onViewChange }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [userRole, setUserRole] = useState<UserType>('customer');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verificationEmail, setVerificationEmail] = useState<string>('');

  const normalizeRoleForApi = (role: UserType) => {
    if (role === 'restaurant') return 'restaurant_owner';
    if (role === 'delivery') return 'delivery_partner';
    return role;
  };

  const normalizeRoleForUi = (role?: string): UserType => {
    if (role === 'restaurant_owner') return 'restaurant';
    if (role === 'delivery_partner') return 'delivery';
    return (role as UserType) || 'customer';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const response = await authService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: normalizeRoleForApi(userRole),
        });
        const newUser = {
          ...(response?.user || {}),
          _id: response?.user?.id || response?.user?._id,
          role: normalizeRoleForUi(response?.user?.role),
        };
        if (response?.token) {
          localStorage.setItem('token', response.token);
        }
        localStorage.setItem('user', JSON.stringify(newUser));
        
        // Auto-detect address for new customers
        if (newUser.role === 'customer') {
          try {
            const addressData = await gpsLocationService.detectHomeAddress();
            if (addressData) {
              localStorage.setItem('userHomeAddress', JSON.stringify({
                street: addressData.address,
                latitude: addressData.latitude,
                longitude: addressData.longitude,
              }));
            }
          } catch (err) {
            console.log('Could not detect address on signup:', err);
          }
        }

        setTimeout(() => {
          onLoginSuccess(newUser);
          onViewChange('home');
        }, 500);
      } else {
        const response = await authService.login({
          email: formData.email,
          password: formData.password,
        });

        if (response?.otpRequired) {
          setVerificationEmail(response.email || formData.email);
          setOtpRequested(true);
          setLoading(false);
          return;
        }

        const user = {
          ...(response?.user || {}),
          _id: response?.user?.id || response?.user?._id,
          role: normalizeRoleForUi(response?.user?.role),
        };
        if (response?.token) {
          localStorage.setItem('token', response.token);
        }
        localStorage.setItem('user', JSON.stringify(user));

        if (user.role === 'customer') {
          try {
            const addressData = await gpsLocationService.detectHomeAddress();
            if (addressData) {
              localStorage.setItem('userHomeAddress', JSON.stringify({
                street: addressData.address,
                latitude: addressData.latitude,
                longitude: addressData.longitude,
              }));
            }
          } catch (err) {
            console.log('Could not detect address on login:', err);
          }
        }

        setTimeout(() => {
          onLoginSuccess(user);
        }, 500);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Authentication failed. Please check your credentials.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationEmail || !otpCode) return;
    setLoading(true);
    try {
      const response = await authService.verifyOtp({
        email: verificationEmail,
        otp: otpCode,
      });
      const user = {
        ...(response?.user || {}),
        _id: response?.user?.id || response?.user?._id,
        role: normalizeRoleForUi(response?.user?.role),
      };
      if (response?.token) {
        localStorage.setItem('token', response.token);
      }
      localStorage.setItem('user', JSON.stringify(user));
      onLoginSuccess(user);
      onViewChange('home');
    } catch (error: any) {
      console.error('OTP verify error:', error);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'OTP verification failed.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!verificationEmail) return;
    setLoading(true);
    try {
      await authService.requestOtp({ email: verificationEmail });
      alert('OTP resent successfully.');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const roles: { id: UserType; label: string; icon: string; color: string }[] = [
    { id: 'customer', label: 'Diner', icon: 'fa-utensils', color: 'text-[#EF4F5F]' },
    { id: 'restaurant', label: 'Partner', icon: 'fa-store', color: 'text-blue-500' },
    { id: 'delivery', label: 'Fleet', icon: 'fa-motorcycle', color: 'text-orange-500' },
    { id: 'admin', label: 'Admin', icon: 'fa-shield-halved', color: 'text-purple-500' }
  ];

  const currentRoleConfig = roles.find(r => r.id === userRole)!;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background with Blur - Changes color based on role */}
      <div className="absolute inset-0 z-0">
        <div className={`absolute inset-0 transition-colors duration-700 ${
          userRole === 'delivery' ? 'bg-orange-600/40' : 
          userRole === 'admin' ? 'bg-purple-900/40' : 
          userRole === 'restaurant' ? 'bg-blue-600/40' : 'bg-black/60'
        } backdrop-blur-xl`}></div>
        <img 
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2000" 
          className="w-full h-full object-cover" 
          alt="Login Background"
        />
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="bg-white rounded-[48px] shadow-2xl overflow-hidden border border-white/20">
          
          <div className="p-10 text-center border-b border-gray-50 bg-gray-50/30">
            <div className={`text-5xl font-black italic tracking-tighter mb-2 drop-shadow-sm transition-colors duration-500 ${currentRoleConfig.color}`}>
              flavorfinder
            </div>
            <p className="text-gray-400 font-black text-[10px] uppercase tracking-[4px]">
              Access Gateway
            </p>
          </div>

          <div className="p-10">
            <div className="mb-10">
              <div className="flex bg-gray-100/80 p-1.5 rounded-[24px] gap-1.5 backdrop-blur-sm">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setUserRole(role.id)}
                    className={`flex-1 py-4 px-1 rounded-2xl transition-all duration-500 flex flex-col items-center gap-1.5 ${
                      userRole === role.id 
                        ? 'bg-white shadow-[0_10px_25px_rgba(0,0,0,0.08)] scale-[1.05] z-10' 
                        : 'text-gray-400 opacity-40 grayscale hover:opacity-80'
                    }`}
                  >
                    <i className={`fa-solid ${role.icon} text-lg transition-transform ${userRole === role.id ? role.color + ' scale-110' : ''}`}></i>
                    <span className={`text-[9px] font-black uppercase tracking-tight ${userRole === role.id ? 'text-gray-900' : ''}`}>{role.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {otpRequested ? (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Enter OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-gray-900 outline-none transition-all font-bold"
                    placeholder="6-digit code"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white py-5 rounded-[24px] font-black text-lg shadow-xl bg-green-600 hover:bg-green-700 transition-all"
                >
                  {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Verify OTP'}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="w-full text-gray-900 py-4 rounded-[24px] font-black text-sm border border-gray-200 hover:bg-gray-100 transition-all"
                >
                  Resend OTP
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpRequested(false);
                    setOtpCode('');
                  }}
                  className="w-full text-red-700 py-4 rounded-[24px] font-black text-sm border border-red-200 hover:bg-red-100 transition-all"
                >
                  Cancel and go back
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                    <input type="text" required className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-gray-900 outline-none transition-all font-bold" placeholder="Your name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Work Email</label>
                  <input type="email" required className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-gray-900 outline-none transition-all font-bold" placeholder="name@company.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Access Password</label>
                  <input type="password" required className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-gray-900 outline-none transition-all font-bold" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white py-5 rounded-[24px] font-black text-lg shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 ${
                    userRole === 'delivery' ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/30' : 
                    userRole === 'admin' ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-600/30' : 
                    userRole === 'restaurant' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-600/30' : 'bg-gradient-to-r from-[#EF4F5F] to-[#E63946] hover:from-[#E63946] hover:to-[#D62828] shadow-[#EF4F5F]/30'
                  }`}
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Processing...</span>
                    </>
                  ) : (
                    `Login as ${userRole}`
                  )}
                </button>
              </form>
            )}


            <div className="mt-10 pt-10 border-t border-gray-50">
              <p className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                {mode === 'login' ? "Access issue?" : "System access?"}
                <button 
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="ml-2 text-gray-900 hover:underline"
                >
                  {mode === 'login' ? 'Request Invite' : 'Back to Login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        onClick={onGoBack}
        className="absolute bottom-10 text-white/60 hover:text-white flex items-center gap-3 font-black text-sm transition-all uppercase tracking-widest"
      >
        <i className="fa-solid fa-arrow-left"></i> Exit Platform
      </button>
    </div>
  );
};

export default LoginPage;
