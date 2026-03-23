import { useState, useEffect } from 'react';
import { 
  FaUsers, FaGamepad, FaMoneyBillWave, FaHeadset, FaArrowUp, FaArrowDown, 
  FaChartLine, FaTrophy, FaWallet, FaUserCheck, FaSpinner 
} from 'react-icons/fa';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from 'recharts';
import { adminAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="text-4xl text-blue-500 animate-spin" />
      </div>
    );
  }

  // Calculate game status data from real stats
  const gameStatusData = [
    { name: 'Completed', value: stats?.games?.completed || 0, color: '#10b981' },
    { name: 'Active', value: stats?.games?.active || 0, color: '#3b82f6' },
    { name: 'Total', value: (stats?.games?.total || 0) - (stats?.games?.completed || 0) - (stats?.games?.active || 0), color: '#6b7280' },
  ].filter(item => item.value > 0);

  // Calculate user status data
  const userStatusData = [
    { name: 'Active', value: stats?.users?.active || 0, color: '#10b981' },
    { name: 'Blocked', value: stats?.users?.blocked || 0, color: '#ef4444' },
    { name: 'KYC Pending', value: stats?.users?.kycPending || 0, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  const netRevenue = (stats?.transactions?.totalDeposits || 0) - (stats?.transactions?.totalWithdrawals || 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-gray-400 text-sm">Welcome back! Here's your overview.</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {/* Total Users */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 lg:p-5 relative overflow-hidden shadow-lg border border-blue-500">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-8 -mt-8" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <FaUsers className="text-xl lg:text-2xl text-white" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-black text-white mb-1">{stats?.users?.total || 0}</p>
            <p className="text-white/80 text-sm font-semibold">Total Users</p>
          </div>
        </div>

        {/* Total Games */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 lg:p-5 relative overflow-hidden shadow-lg border border-purple-500">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-8 -mt-8" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <FaGamepad className="text-xl lg:text-2xl text-white" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-black text-white mb-1">{stats?.games?.total || 0}</p>
            <p className="text-white/80 text-sm font-semibold">Total Games</p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4 lg:p-5 relative overflow-hidden shadow-lg border border-green-500">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-8 -mt-8" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <FaMoneyBillWave className="text-xl lg:text-2xl text-white" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-black text-white mb-1">₹{stats?.transactions?.totalDeposits || 0}</p>
            <p className="text-white/80 text-sm font-semibold">Total Deposits</p>
          </div>
        </div>

        {/* Support Tickets */}
        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-4 lg:p-5 relative overflow-hidden shadow-lg border border-orange-500">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-8 -mt-8" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <FaHeadset className="text-xl lg:text-2xl text-white" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-black text-white mb-1">{stats?.support?.openTickets || 0}</p>
            <p className="text-white/80 text-sm font-semibold">Open Tickets</p>
          </div>
        </div>
      </div>

      {/* Charts and Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Game Status Pie Chart */}
        {gameStatusData.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Game Status</h2>
                <p className="text-gray-400 text-xs">Distribution</p>
              </div>
              <FaTrophy className="text-2xl text-yellow-500" />
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={gameStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {gameStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {gameStatusData.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-400">{item.name}</span>
                  </div>
                  <p className="text-white font-bold text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Status Pie Chart */}
        {userStatusData.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">User Status</h2>
                <p className="text-gray-400 text-xs">Distribution</p>
              </div>
              <FaUserCheck className="text-2xl text-blue-500" />
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={userStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {userStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {userStatusData.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-400">{item.name}</span>
                  </div>
                  <p className="text-white font-bold text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Stats */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Financial Stats</h2>
              <p className="text-gray-400 text-xs">Overview</p>
            </div>
            <FaWallet className="text-2xl text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-750 rounded-lg">
              <span className="text-gray-400 text-sm">Deposits</span>
              <span className="text-green-400 font-bold">₹{stats?.transactions?.totalDeposits || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-750 rounded-lg">
              <span className="text-gray-400 text-sm">Withdrawals</span>
              <span className="text-red-400 font-bold">₹{stats?.transactions?.totalWithdrawals || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-750 rounded-lg">
              <span className="text-gray-400 text-sm">Pending</span>
              <span className="text-yellow-400 font-bold">{stats?.transactions?.pendingWithdrawals || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg">
              <span className="text-white text-sm font-semibold">Net Revenue</span>
              <span className="text-blue-400 font-black text-lg">₹{netRevenue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mt-6">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Active Users</p>
          <p className="text-2xl font-bold text-green-400">{stats?.users?.active || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Blocked Users</p>
          <p className="text-2xl font-bold text-red-400">{stats?.users?.blocked || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Active Games</p>
          <p className="text-2xl font-bold text-blue-400">{stats?.games?.active || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Completed Games</p>
          <p className="text-2xl font-bold text-purple-400">{stats?.games?.completed || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
