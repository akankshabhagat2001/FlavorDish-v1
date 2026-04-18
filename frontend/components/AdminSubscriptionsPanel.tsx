import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

const AdminSubscriptionsPanel: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await adminService.getSubscriptions({ limit: 100 });
      setSubscriptions(data?.subscriptions || []);
    } catch (err) {
      console.error('Failed to fetch subscriptions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const planStyle = (plan: string) => {
    if (plan === 'elite') return 'bg-amber-100 text-amber-600 border border-amber-400';
    if (plan === 'premium') return 'bg-violet-100 text-violet-600 border border-violet-400';
    return 'bg-slate-100 text-slate-600 border border-slate-300';
  };

  return (
    <div className="bg-[#2A2B2E] rounded-xl p-5 border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-2xl text-white">Active Subscriptions</h3>
        <button onClick={fetchSubscriptions} className="text-violet-400 hover:text-white p-2 transition">
          <i className="fa-solid fa-rotate-right"></i> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 py-10 text-center">Loading subscriptions...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#17181A] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">User</th>
                <th className="px-4 py-3">Plan Tier</th>
                <th className="px-4 py-3">Monthly Fee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right rounded-tr-lg">Renewal Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {subscriptions.map(sub => (
                <tr key={sub._id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{sub.userId?.name || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{sub.userId?.email || ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-[4px] text-[10px] font-black uppercase ${planStyle(sub.plan)}`}>
                      {sub.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">₹{sub.monthlyFee}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black uppercase ${sub.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {sub.isActive ? 'Active' : 'Muted'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No active subscriptions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionsPanel;
