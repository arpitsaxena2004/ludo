import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  FaSearch, FaBan, FaEye, FaUser, FaWallet, FaGamepad, 
  FaTrophy, FaCheckCircle, FaTimesCircle, FaTrash, FaUnlock,
  FaCalendar, FaEnvelope, FaPhone, FaIdCard, FaSpinner,
  FaChartLine, FaCoins, FaMoneyBillWave
} from 'react-icons/fa';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAction, setFundAction] = useState('add'); // 'add' or 'deduct'
  const [fundAmount, setFundAmount] = useState('');
  const [fundType, setFundType] = useState('deposit'); // 'deposit', 'winning', 'bonus'
  const [fundReason, setFundReason] = useState('');
  const [fundLoading, setFundLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers(1, 100, search);
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (id) => {
    if (!window.confirm('Are you sure you want to block this user?')) return;
    
    setActionLoading(true);
    try {
      await adminAPI.blockUser(id);
      toast.success('User blocked successfully');
      fetchUsers();
      if (selectedUser?._id === id) {
        setSelectedUser(null);
      }
    } catch (error) {
      toast.error('Failed to block user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async (id) => {
    if (!window.confirm('Are you sure you want to unblock this user?')) return;
    
    setActionLoading(true);
    try {
      await adminAPI.unblockUser(id);
      toast.success('User unblocked successfully');
      fetchUsers();
      if (selectedUser?._id === id) {
        setSelectedUser(null);
      }
    } catch (error) {
      toast.error('Failed to unblock user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    setActionLoading(true);
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deleted successfully');
      fetchUsers();
      setShowDeleteModal(null);
      setSelectedUser(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const openFundModal = (action) => {
    setFundAction(action);
    setFundAmount('');
    setFundType('deposit');
    setFundReason('');
    setShowFundModal(true);
  };

  const handleFundManagement = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setFundLoading(true);
    try {
      if (fundAction === 'add') {
        await adminAPI.addFunds(selectedUser._id, parseFloat(fundAmount), fundType, fundReason);
        toast.success(`₹${fundAmount} added to ${fundType} cash successfully!`);
      } else {
        await adminAPI.deductFunds(selectedUser._id, parseFloat(fundAmount), fundType, fundReason);
        toast.success(`₹${fundAmount} deducted from ${fundType} cash successfully!`);
      }
      
      setShowFundModal(false);
      fetchUsers();
      
      // Update selected user
      const response = await adminAPI.getUserById(selectedUser._id);
      setSelectedUser(response.data.user);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${fundAction} funds`);
    } finally {
      setFundLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'active') return !user.isBlocked && user.isActive;
    if (filter === 'blocked') return user.isBlocked;
    if (filter === 'kyc-verified') return user.isKYCVerified;
    return true;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => !u.isBlocked && u.isActive).length,
    blocked: users.filter(u => u.isBlocked).length,
    kycVerified: users.filter(u => u.isKYCVerified).length,
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Users Management</h1>
        
        {/* Stats Summary */}
        <div className="flex gap-2 text-sm flex-wrap">
          <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg border border-blue-500">
            {stats.total} Total
          </div>
          <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg border border-green-500">
            {stats.active} Active
          </div>
          <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg border border-red-500">
            {stats.blocked} Blocked
          </div>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by phone, email, or username..."
            className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg outline-none border border-gray-700 focus:border-blue-500 text-sm"
          />
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm capitalize transition-all ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm capitalize transition-all ${
            filter === 'active'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Active ({stats.active})
        </button>
        <button
          onClick={() => setFilter('blocked')}
          className={`px-4 py-2 rounded-lg text-sm capitalize transition-all ${
            filter === 'blocked'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Blocked ({stats.blocked})
        </button>
        <button
          onClick={() => setFilter('kyc-verified')}
          className={`px-4 py-2 rounded-lg text-sm capitalize transition-all ${
            filter === 'kyc-verified'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          KYC Verified ({stats.kycVerified})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <FaSpinner className="text-3xl text-blue-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {filteredUsers.map((user) => (
              <div key={user._id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={user.avatar || 'https://via.placeholder.com/50'}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-600"
                  />
                  <div className="flex-1">
                    <p className="text-white font-semibold">{user.username || 'User'}</p>
                    <p className="text-gray-400 text-sm">{user.phoneNumber}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        user.isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                      {user.isKYCVerified && (
                        <span className="text-blue-400 text-xs flex items-center gap-1">
                          <FaCheckCircle /> KYC
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                  <p className="text-green-400 font-semibold">₹{(user.depositCash + user.winningCash).toFixed(2)}</p>
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-white text-sm font-semibold">User</th>
                    <th className="px-6 py-4 text-left text-white text-sm font-semibold">Contact</th>
                    <th className="px-6 py-4 text-left text-white text-sm font-semibold">Balance</th>
                    <th className="px-6 py-4 text-left text-white text-sm font-semibold">Games</th>
                    <th className="px-6 py-4 text-left text-white text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-white text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="border-t border-gray-700 hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar || 'https://via.placeholder.com/40'}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"
                          />
                          <div>
                            <p className="text-white font-medium">{user.username || 'User'}</p>
                            <p className="text-gray-400 text-xs">{user.referralCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white text-sm">{user.phoneNumber}</p>
                        {user.email && <p className="text-gray-400 text-xs">{user.email}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-green-400 font-semibold">₹{(user.depositCash + user.winningCash).toFixed(2)}</p>
                        <p className="text-gray-400 text-xs">D: ₹{user.depositCash} | W: ₹{user.winningCash}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white text-sm">{user.totalGamesPlayed || 0}</p>
                        <p className="text-gray-400 text-xs">Won: {user.totalGamesWon || 0}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 rounded text-xs inline-flex items-center gap-1 w-fit ${
                            user.isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                            {user.isBlocked ? <FaTimesCircle /> : <FaCheckCircle />}
                            {user.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                          {user.isKYCVerified && (
                            <span className="text-blue-400 text-xs flex items-center gap-1">
                              <FaIdCard /> Verified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              No users found
            </div>
          )}
        </>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
          <div className="bg-gray-800 rounded-2xl w-full max-w-4xl border border-gray-700 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <img
                  src={selectedUser.avatar || 'https://via.placeholder.com/80'}
                  alt={selectedUser.username}
                  className="w-16 h-16 rounded-full object-cover border-4 border-gray-600"
                />
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedUser.username || 'User'}</h3>
                  <p className="text-gray-400">{selectedUser.phoneNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className={`px-3 py-1 rounded-lg text-sm border inline-flex items-center gap-2 ${
                  selectedUser.isBlocked 
                    ? 'bg-red-500/20 text-red-400 border-red-500' 
                    : 'bg-green-500/20 text-green-400 border-green-500'
                }`}>
                  {selectedUser.isBlocked ? <FaTimesCircle /> : <FaCheckCircle />}
                  {selectedUser.isBlocked ? 'Blocked' : 'Active'}
                </span>
                {selectedUser.isKYCVerified && (
                  <span className="px-3 py-1 rounded-lg text-sm border bg-blue-500/20 text-blue-400 border-blue-500 inline-flex items-center gap-2">
                    <FaIdCard /> KYC Verified
                  </span>
                )}
              </div>

              {/* User Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Personal Info */}
                <div className="bg-gray-750 rounded-xl p-4 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <FaUser className="text-blue-400" /> Personal Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Username</p>
                      <p className="text-white">{selectedUser.username || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                        <FaPhone className="text-xs" /> Phone Number
                      </p>
                      <p className="text-white">{selectedUser.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                        <FaEnvelope className="text-xs" /> Email
                      </p>
                      <p className="text-white">{selectedUser.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Referral Code</p>
                      <p className="text-white font-mono">{selectedUser.referralCode}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                        <FaCalendar className="text-xs" /> Joined
                      </p>
                      <p className="text-white text-sm">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Wallet Info */}
                <div className="bg-gray-750 rounded-xl p-4 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <FaWallet className="text-green-400" /> Wallet Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Total Balance</p>
                      <p className="text-green-400 font-bold text-2xl">
                        ₹{(selectedUser.depositCash + selectedUser.winningCash + selectedUser.bonusCash).toFixed(2)}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-700 p-2 rounded">
                        <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                          <FaMoneyBillWave className="text-xs" /> Deposit
                        </p>
                        <p className="text-white font-semibold">₹{selectedUser.depositCash}</p>
                      </div>
                      <div className="bg-gray-700 p-2 rounded">
                        <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                          <FaTrophy className="text-xs" /> Winning
                        </p>
                        <p className="text-white font-semibold">₹{selectedUser.winningCash}</p>
                      </div>
                      <div className="bg-gray-700 p-2 rounded">
                        <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                          <FaCoins className="text-xs" /> Bonus
                        </p>
                        <p className="text-white font-semibold">₹{selectedUser.bonusCash}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Total Withdrawal</p>
                      <p className="text-red-400 font-semibold">₹{selectedUser.totalWithdrawal || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Referral Earnings</p>
                      <p className="text-purple-400 font-semibold">₹{selectedUser.referralEarnings || 0}</p>
                    </div>
                  </div>
                  
                  {/* Fund Management Buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
                    <button
                      onClick={() => openFundModal('add')}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <FaMoneyBillWave /> Add Funds
                    </button>
                    <button
                      onClick={() => openFundModal('deduct')}
                      className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <FaMoneyBillWave /> Deduct Funds
                    </button>
                  </div>
                </div>

                {/* Gaming Stats */}
                <div className="bg-gray-750 rounded-xl p-4 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <FaGamepad className="text-purple-400" /> Gaming Statistics
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Total Games Played</p>
                      <p className="text-white font-bold text-xl">{selectedUser.totalGamesPlayed || 0}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-green-500/10 p-2 rounded border border-green-500/30">
                        <p className="text-green-400 text-xs mb-1">Won</p>
                        <p className="text-green-400 font-bold text-lg">{selectedUser.totalGamesWon || 0}</p>
                      </div>
                      <div className="bg-red-500/10 p-2 rounded border border-red-500/30">
                        <p className="text-red-400 text-xs mb-1">Lost</p>
                        <p className="text-red-400 font-bold text-lg">{selectedUser.totalGamesLost || 0}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                        <FaChartLine className="text-xs" /> Win Rate
                      </p>
                      <p className="text-white font-semibold">
                        {selectedUser.totalGamesPlayed > 0 
                          ? ((selectedUser.totalGamesWon / selectedUser.totalGamesPlayed) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Total Coins Won</p>
                      <p className="text-yellow-400 font-semibold">₹{selectedUser.totalCoinsWon || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Referral Info */}
                <div className="bg-gray-750 rounded-xl p-4 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <FaUser className="text-orange-400" /> Referral Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Referred By</p>
                      <p className="text-white">{selectedUser.referredBy || 'Direct signup'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Total Referrals</p>
                      <p className="text-white font-bold text-xl">{selectedUser.referredUsers?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Referral Earnings</p>
                      <p className="text-purple-400 font-semibold">₹{selectedUser.referralEarnings || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-700">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
                {selectedUser.isBlocked ? (
                  <button
                    onClick={() => handleUnblockUser(selectedUser._id)}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <FaSpinner className="animate-spin" /> : <FaUnlock />}
                    Unblock User
                  </button>
                ) : (
                  <button
                    onClick={() => handleBlockUser(selectedUser._id)}
                    disabled={actionLoading}
                    className="flex-1 bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <FaSpinner className="animate-spin" /> : <FaBan />}
                    Block User
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteModal(selectedUser)}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FaTrash />
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-red-500">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FaTrash className="text-red-400" />
              Delete User
            </h3>
            <p className="text-gray-300 mb-2">
              Are you sure you want to permanently delete this user?
            </p>
            <p className="text-red-400 text-sm mb-4">
              ⚠️ This action cannot be undone. All user data will be permanently removed.
            </p>
            <div className="bg-gray-700 p-3 rounded-lg mb-4">
              <p className="text-white font-semibold">{showDeleteModal.username || 'User'}</p>
              <p className="text-gray-400 text-sm">{showDeleteModal.phoneNumber}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteModal._id)}
                disabled={actionLoading}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fund Management Modal */}
      {showFundModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowFundModal(false)}>
          <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <FaMoneyBillWave className={fundAction === 'add' ? 'text-green-400' : 'text-red-400'} />
              {fundAction === 'add' ? 'Add Funds' : 'Deduct Funds'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Amount (₹)</label>
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Cash Type</label>
                <select
                  value={fundType}
                  onChange={(e) => setFundType(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="deposit">Deposit Cash</option>
                  <option value="winning">Winning Cash</option>
                  <option value="bonus">Bonus Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Reason (Optional)</label>
                <textarea
                  value={fundReason}
                  onChange={(e) => setFundReason(e.target.value)}
                  placeholder="Enter reason for this transaction"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none"
                  rows="3"
                />
              </div>

              <div className={`p-4 rounded-lg border ${fundAction === 'add' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <p className={`text-sm font-semibold ${fundAction === 'add' ? 'text-green-400' : 'text-red-400'}`}>
                  {fundAction === 'add' ? '✓' : '⚠️'} {fundAmount ? `₹${fundAmount}` : '₹0'} will be {fundAction === 'add' ? 'added to' : 'deducted from'} {fundType} cash
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowFundModal(false)}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFundManagement}
                  disabled={fundLoading || !fundAmount}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                    fundAction === 'add'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                      : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white'
                  }`}
                >
                  {fundLoading ? <FaSpinner className="animate-spin" /> : null}
                  {fundAction === 'add' ? 'Add Funds' : 'Deduct Funds'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
