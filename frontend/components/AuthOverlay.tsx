
import React, { useState } from 'react';
import { UserType } from '../types';

interface AuthOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; role: UserType }) => void;
  initialMode?: 'login' | 'signup';
}

const MOCK_SOCIAL_ACCOUNTS = [
  { name: 'John Doe', email: 'john.doe@gmail.com' },
  { name: 'Jane Smith', email: 'jane.smith@outlook.com' },
  { name: 'Alex Partner', email: 'alex.restaurant@business.com' }
];

const AuthOverlay: React.FC<AuthOverlayProps> = ({ isOpen, onClose, onLoginSuccess, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  // Fix: Default to valid 'customer' RoleType instead of 'User'
  const [userRole, setUserRole] = useState<UserType>('customer');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [isSocialSelectorOpen, setIsSocialSelectorOpen] = useState(false);
  const [socialProvider, setSocialProvider] = useState<'Google' | 'Facebook' | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      onLoginSuccess({ 
        name: formData.name || formData.email.split('@')[0], 
        role: userRole 
      });
      setLoading(false);
      onClose();
    }, 1000);
  };

  const handleSocialClick = (provider: 'Google' | 'Facebook') => {
    setSocialProvider(provider);
    setIsSocialSelectorOpen(true);
  };

  const handleSocialAccountSelect = (account: { name: string; email: string }) => {
    setLoading(true);
    setIsSocialSelectorOpen(false);
    // Simulate social auth redirect/callback
    setTimeout(() => {
      onLoginSuccess({ 
        name: account.name, 
        role: userRole 
      });
      setLoading(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {isSocialSelectorOpen ? `Continue with ${socialProvider}` : mode === 'login' ? 'Login' : 'Create Account'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <i className="fa-solid fa-xmark text-xl text-gray-400"></i>
          </button>
        </div>

        <div className="p-8">
          {isSocialSelectorOpen ? (
            <div className="animate-fade-in space-y-4">
              <p className="text-sm text-gray-500 mb-6">Choose an account to continue to FlavorFinder</p>
              {MOCK_SOCIAL_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleSocialAccountSelect(account)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all text-left group"
                >
                  <div className="w-10 h-10 bg-[#EF4F5F]/10 text-[#EF4F5F] rounded-full flex items-center justify-center font-bold">
                    {account.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800">{account.name}</div>
                    <div className="text-xs text-gray-400">{account.email}</div>
                  </div>
                  <i className="fa-solid fa-chevron-right text-gray-300 group-hover:text-gray-400 transition-colors"></i>
                </button>
              ))}
              <button 
                onClick={() => setIsSocialSelectorOpen(false)}
                className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors mt-4"
              >
                Back to email login
              </button>
            </div>
          ) : (
            <>
              {/* Role Selector */}
              <div className="flex bg-gray-100 p-1 rounded-xl mb-8 overflow-x-auto no-scrollbar">
                {/* Fix: Use correct lowercase RoleType values from types.ts */}
                {(['customer', 'restaurant', 'delivery', 'admin'] as UserType[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => setUserRole(role)}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all min-w-[70px] ${
                      userRole === role ? 'bg-white text-[#EF4F5F] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {/* Fix: Descriptive mapping for role labels */}
                    {role === 'restaurant' ? 'Partner' : role === 'customer' ? 'Diner' : role === 'delivery' ? 'Fleet' : 'Admin'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#EF4F5F]/10 focus:border-[#EF4F5F] outline-none transition-all"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#EF4F5F]/10 focus:border-[#EF4F5F] outline-none transition-all"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#EF4F5F]/10 focus:border-[#EF4F5F] outline-none transition-all"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#EF4F5F] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#EF4F5F]/20 hover:bg-[#d43d4c] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (mode === 'login' ? 'Sign In' : 'Create Account')}
                </button>
              </form>

              <div className="mt-8 text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                  <div className="relative"><span className="bg-white px-4 text-xs text-gray-400 uppercase font-bold tracking-widest">or</span></div>
                </div>
                
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => handleSocialClick('Google')}
                    className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors group"
                  >
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale group-hover:grayscale-0" alt="Google" />
                  </button>
                  <button 
                    onClick={() => handleSocialClick('Facebook')}
                    className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors group"
                  >
                    <i className="fa-brands fa-facebook text-[#1877F2] text-xl opacity-50 group-hover:opacity-100 transition-opacity"></i>
                  </button>
                </div>

                <p className="text-gray-500 text-sm">
                  {mode === 'login' ? "New to FlavorFinder?" : "Already have an account?"}
                  <button 
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="ml-2 text-[#EF4F5F] font-bold hover:underline"
                  >
                    {mode === 'login' ? 'Create account' : 'Login'}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthOverlay;
