import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

const AdminUsersPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers({ limit: 100 });
      setUsers(data?.users || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await adminService.updateUserStatus(userId, !currentStatus);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update role', err);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminService.deleteUser(userId);
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user', err);
      alert('Cannot delete admin users or deletion failed.');
    }
  };

  return (
    <div className="bg-[#2A2B2E] rounded-xl p-5 border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-2xl text-white">User Management</h3>
        <button onClick={fetchUsers} className="text-violet-400 hover:text-white p-2 transition">
          <i className="fa-solid fa-rotate-right"></i> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 py-10 text-center">Loading users...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#17181A] text-slate-400 uppercase text-[10px] tracking-wider uppercase border-b border-white/10">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(user => (
                <tr key={user._id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3 font-semibold text-white">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <select 
                      value={user.role} 
                      onChange={(e) => handleChangeRole(user._id, e.target.value)}
                      className="bg-[#17181A] border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-violet-500"
                      disabled={user.role === 'admin'}
                    >
                      <option value="customer">Customer</option>
                      <option value="restaurant_owner">Rest. Owner</option>
                      <option value="delivery_partner">Delivery Partner</option>
                      <option value="admin" disabled>Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => handleToggleStatus(user._id, user.isActive !== false)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${user.isActive !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                      disabled={user.role === 'admin'}
                    >
                      {user.isActive !== false ? 'Active' : 'Blocked'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => handleDelete(user._id)} className="p-2 text-slate-400 hover:text-red-400 transition" disabled={user.role === 'admin'}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPanel;
