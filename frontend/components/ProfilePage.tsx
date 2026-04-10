import React, { useEffect, useState } from 'react';
import { authService } from '../services';
import { User, AppViewState } from '../types';
import { gpsLocationService } from '../services/gpsLocationService';

interface ProfilePageProps {
  onLogout: () => void;
  onViewChange: (view: AppViewState) => void;
  onProfileUpdated: (user: User) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onLogout, onViewChange, onProfileUpdated }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', street: '', city: '', state: '', zipCode: '' });
  const [feedback, setFeedback] = useState('');

  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', otp: '' });
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await authService.getProfile();
      const profileUser = response.user;
      setUser(profileUser);
      setForm({
        name: profileUser.name || '',
        phone: profileUser.phone || '',
        street: profileUser.address?.street || '',
        city: profileUser.address?.city || '',
        state: profileUser.address?.state || '',
        zipCode: profileUser.address?.zipCode || ''
      });
    } catch (error: any) {
      console.error('Profile load failed', error);
      setFeedback('Unable to load profile. Please login again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const address = {
        street: form.street,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode
      };
      const updated = await authService.updateProfile({ name: form.name, phone: form.phone, address });
      setUser(updated.user);
      onProfileUpdated(updated.user);
      setFeedback('Profile updated successfully.');
    } catch (error: any) {
      setFeedback(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordOtp = async () => {
    if (!user?.email && !user?.phone) {
      setFeedback('No email/phone available for OTP.');
      return;
    }

    setLoading(true);
    try {
      await authService.requestOtp({ email: user.email });
      setOtpSent(true);
      setFeedback('OTP sent. Enter the code to confirm password change.');
    } catch (error: any) {
      setFeedback(error.response?.data?.message || 'Could not send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const detectGPSLocation = async () => {
    setDetecting(true);
    try {
      const result = await gpsLocationService.detectHomeAddress();
      if (result) {
        setForm({
          ...form,
          street: result.address,
          city: result.address.split(',')[1]?.trim() || 'Ahmedabad',
        });
        setFeedback(`✓ Location detected: ${result.address.substring(0, 50)}...`);
      } else {
        setFeedback('⚠️ Could not detect location. Please enable GPS in your browser and try again.');
      }
    } catch (error: any) {
      const errorMsg = gpsLocationService.getGpsErrorMessage(error);
      console.error('GPS Error:', error);
      setFeedback(errorMsg);
    } finally {
      setDetecting(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.otp) {
      setFeedback('Fill current password, new password and OTP.');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(passwordData);
      setFeedback('Password changed successfully.');
      setPasswordData({ currentPassword: '', newPassword: '', otp: '' });
      setOtpSent(false);
    } catch (error: any) {
      setFeedback(error.response?.data?.message || 'Password change failed.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return <div className="p-10 text-center text-gray-500">Loading profile...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black">My Profile</h2>
            <p className="text-sm text-gray-400">Update your personal details and password with secure OTP verification.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onViewChange('home')} className="px-4 py-2 bg-gray-100 rounded-xl font-bold text-sm">Marketplace</button>
            <button onClick={onLogout} className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-sm">Logout</button>
          </div>
        </div>

        {feedback && <p className="text-sm text-emerald-600 font-bold mb-4">{feedback}</p>}

        <form onSubmit={saveProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Full Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3" required />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Street Address</label>
              <input value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} placeholder="Your street address" className="w-full border border-gray-200 rounded-xl px-4 py-3" />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">City</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Your city" className="w-full border border-gray-200 rounded-xl px-4 py-3" />
            </div>
          </div>

          <button
            type="button"
            onClick={detectGPSLocation}
            disabled={detecting}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl py-3 font-black mb-4 transition-all"
          >
            {detecting ? '🔄 Detecting Location...' : '📍 Detect My Home Address (GPS)'}
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="State" className="w-full border border-gray-200 rounded-xl px-4 py-3" />
            <input value={form.zipCode} onChange={e => setForm({ ...form, zipCode: e.target.value })} placeholder="ZIP/Pin" className="w-full border border-gray-200 rounded-xl px-4 py-3" />
            <input value={user?.email || ''} disabled placeholder="Email" className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50" />
          </div>

          <button type="submit" className="w-full bg-[#EF4F5F] text-white rounded-xl py-3 font-black">Save Profile</button>
        </form>

        <div className="mt-10 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black">Change Password</h3>
            <button onClick={requestPasswordOtp} type="button" className="text-sm text-blue-600 underline">Send OTP</button>
          </div>

          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <input type="password" value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} placeholder="Current Password" className="w-full border border-gray-200 rounded-xl px-4 py-3" required />
            </div>
            <div>
              <input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} placeholder="New Password" className="w-full border border-gray-200 rounded-xl px-4 py-3" required />
            </div>
            <div>
              <input type="text" value={passwordData.otp} onChange={e => setPasswordData({ ...passwordData, otp: e.target.value })} placeholder="OTP" className="w-full border border-gray-200 rounded-xl px-4 py-3" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-3 font-black">Confirm Password Change</button>
          </form>
          {otpSent && <p className="mt-2 text-xs text-green-500">OTP sent to your registered email/phone.</p>}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
