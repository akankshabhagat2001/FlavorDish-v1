import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

const AdminRestaurantsPanel: React.FC = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const data = await adminService.getRestaurants({ limit: 100 });
      setRestaurants(data?.restaurants || []);
    } catch (err) {
      console.error('Failed to fetch restaurants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleApproval = async (id: string, isApproved: boolean) => {
    try {
      await adminService.approveRestaurant(id, isApproved);
      fetchRestaurants();
    } catch (err) {
      console.error('Failed to update approval status', err);
    }
  };

  return (
    <div className="bg-[#2A2B2E] rounded-xl p-5 border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-2xl text-white">Restaurant Management</h3>
        <button onClick={fetchRestaurants} className="text-violet-400 hover:text-white p-2 transition">
          <i className="fa-solid fa-rotate-right"></i> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 py-10 text-center">Loading restaurants...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#17181A] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Restaurant</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Approved</th>
                <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {restaurants.map(rest => (
                <tr key={rest._id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{rest.name}</div>
                    <div className="text-xs text-slate-500">{rest.address?.city || 'No City'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{rest.owner?.name || 'N/A'}</div>
                    <div className="text-xs text-slate-500">{rest.owner?.email || ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${rest.isOpen ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-500/20 text-slate-400'}`}>
                      {rest.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {rest.isApproved ? (
                      <span className="text-emerald-400 font-bold"><i className="fa-solid fa-check"></i> Yes</span>
                    ) : (
                      <span className="text-amber-400 font-bold"><i className="fa-solid fa-clock"></i> Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {!rest.isApproved ? (
                      <>
                        <button onClick={() => handleApproval(rest._id, true)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition">Approve</button>
                        <button onClick={() => handleApproval(rest._id, false)} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition">Reject</button>
                      </>
                    ) : (
                      <button onClick={() => handleApproval(rest._id, false)} className="px-3 py-1 bg-slate-700 hover:bg-red-600 text-white rounded text-xs font-bold transition">Revoke</button>
                    )}
                  </td>
                </tr>
              ))}
              {restaurants.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No restaurants found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminRestaurantsPanel;
