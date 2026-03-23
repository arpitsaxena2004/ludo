import { useState, useEffect } from 'react';
import { FaSearch, FaCheck, FaTimes, FaEye, FaClock, FaCheckCircle, FaTimesCircle, FaImage, FaMoneyBillWave, FaSpinner, FaFilter } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';

const Deposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [filteredDeposits, setFilteredDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDeposits();
  }, []);

  useEffect(() => {
    filterDeposits();
  }, [deposits, searchTerm, statusFilter]);

  const fetchDeposits = async () => {
    try {
      const adminStorage = localStorage.getItem('admin-storage');
      const token = adminStorage ? JSON.parse(adminStorage).state.token : null;
      const response = await axios.get('/payment/admin/deposits', {
        baseURL: import.meta.env.VITE_API_URL,
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeposits(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch deposits');
    } finally {
      setLoading(false);
    }
  };

  const filterDeposits = () => {
    let filtered = deposits;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.user?.phoneNumber?.includes(searchTerm) ||
        d.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.upiTransactionId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDeposits(filtered);
  };

  const handleApprove = async () => {
    if (!selectedDeposit) return;
    
    setProcessing(true);
    try {
      const adminStorage = localStorage.getItem('admin-storage');
      const token = adminStorage ? JSON.parse(adminStorage).state.token : null;
      await axios.put(
        `/payment/admin/deposit/${selectedDeposit._id}/approve`,
        { adminNotes },
        { 
          baseURL: import.meta.env.VITE_API_URL,
          headers: { Authorization: `Bearer ${token}` } 
        }
      );
      
      toast.success('Deposit approved successfully! 🎉');
      setShowModal(false);
      setAdminNotes('');
      fetchDeposits();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve deposit');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDeposit) return;
    
    setProcessing(true);
    try {
      const adminStorage = localStorage.getItem('admin-storage');
      const token = adminStorage ? JSON.parse(adminStorage).state.token : null;
      await axios.put(
        `/payment/admin/deposit/${selectedDeposit._id}/reject`,
        { adminNotes },
        { 
          baseURL: import.meta.env.VITE_API_URL,
          headers: { Authorization: `Bearer ${token}` } 
        }
      );
      
      toast.success('Deposit rejected');
      setShowModal(false);
      setAdminNotes('');
      fetchDeposits();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject deposit');
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (deposit) => {
    setSelectedDeposit(deposit);
    setAdminNotes(deposit.adminNotes || '');
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: FaClock, label: 'Pending', border: 'border-yellow-500' },
      approved: { bg: 'bg-green-500/20', text: 'text-green-400', icon: FaCheckCircle, label: 'Approved', border: 'border-green-500' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: FaTimesCircle, label: 'Rejected', border: 'border-red-500' }
    };
    const badge = badges[status];
    const Icon = badge.icon;
    return (
      <span className={`${badge.bg} ${badge.text} ${badge.border} border px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1`}>
        <Icon /> {badge.label}
      </span>
    );
  };

  const stats = {
    total: deposits.length,
    pending: deposits.filter(d => d.status === 'pending').length,
    approved: deposits.filter(d => d.status === 'approved').length,
    rejected: deposits.filter(d => d.status === 'rejected').length,
    totalAmount: deposits.filter(d => d.status === 'approved').reduce((sum, d) => sum + d.amount, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="text-4xl text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Deposit Requests</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500 rounded-xl p-4">
          <p className="text-blue-400 text-sm font-semibold mb-1">Total Requests</p>
          <p className="text-3xl font-black text-white">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500 rounded-xl p-4">
          <p className="text-yellow-400 text-sm font-semibold mb-1">Pending</p>
          <p className="text-3xl font-black text-white">{stats.pending}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500 rounded-xl p-4">
          <p className="text-green-400 text-sm font-semibold mb-1">Approved</p>
          <p className="text-3xl font-black text-white">{stats.approved}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500 rounded-xl p-4">
          <p className="text-red-400 text-sm font-semibold mb-1">Rejected</p>
          <p className="text-3xl font-black text-white">{stats.rejected}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500 rounded-xl p-4">
          <p className="text-purple-400 text-sm font-semibold mb-1">Total Approved</p>
          <p className="text-3xl font-black text-white">₹{stats.totalAmount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by phone, username, or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                statusFilter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                statusFilter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Deposits List */}
      <div className="space-y-3">
        {filteredDeposits.length === 0 ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
            <FaMoneyBillWave className="text-6xl text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No deposit requests found</p>
          </div>
        ) : (
          filteredDeposits.map((deposit) => (
            <div
              key={deposit._id}
              className="bg-gray-800 rounded-xl border border-gray-700 p-4 hover:border-blue-500/50 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-bold text-lg">{deposit.user?.username || 'User'}</p>
                      <p className="text-gray-400 text-sm">{deposit.user?.phoneNumber}</p>
                    </div>
                    {getStatusBadge(deposit.status)}
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Amount</p>
                      <p className="text-green-400 font-bold text-xl">₹{deposit.amount}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Transaction ID</p>
                      <p className="text-white text-sm">{deposit.upiTransactionId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Date</p>
                      <p className="text-white text-sm">{new Date(deposit.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Time</p>
                      <p className="text-white text-sm">{new Date(deposit.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openModal(deposit)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all font-semibold flex items-center justify-center gap-2"
                >
                  <FaEye /> View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-white">Deposit Request Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-3xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-750 rounded-xl p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <FaMoneyBillWave className="text-blue-400" /> Request Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">User</p>
                    <p className="text-white font-semibold">{selectedDeposit.user?.username || 'N/A'}</p>
                    <p className="text-gray-300 text-sm">{selectedDeposit.user?.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Amount</p>
                    <p className="text-green-400 font-bold text-2xl">₹{selectedDeposit.amount}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Status</p>
                    {getStatusBadge(selectedDeposit.status)}
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Date & Time</p>
                    <p className="text-white">{new Date(selectedDeposit.createdAt).toLocaleString()}</p>
                  </div>
                  {selectedDeposit.upiTransactionId && (
                    <div className="col-span-2">
                      <p className="text-gray-400 text-sm mb-1">UPI Transaction ID</p>
                      <p className="text-white font-mono bg-gray-700 px-3 py-2 rounded">{selectedDeposit.upiTransactionId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Screenshot */}
              <div>
                <p className="text-gray-400 text-sm mb-3 flex items-center gap-2">
                  <FaImage /> Payment Screenshot
                </p>
                <a href={selectedDeposit.screenshot} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={selectedDeposit.screenshot} 
                    alt="Payment Screenshot" 
                    className="w-full max-w-md mx-auto rounded-xl border-2 border-gray-700 hover:border-blue-500 cursor-pointer transition-all shadow-2xl"
                  />
                </a>
              </div>

              {/* Admin Notes */}
              {selectedDeposit.status === 'pending' && (
                <div>
                  <label className="block text-gray-400 text-sm mb-2 font-semibold">Admin Notes (Optional)</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    rows="3"
                    placeholder="Add notes for the user..."
                  />
                </div>
              )}

              {selectedDeposit.adminNotes && selectedDeposit.status !== 'pending' && (
                <div className="bg-blue-500/10 border border-blue-500 rounded-xl p-4">
                  <p className="text-blue-400 text-sm font-semibold mb-2">Admin Notes:</p>
                  <p className="text-white">{selectedDeposit.adminNotes}</p>
                </div>
              )}

              {selectedDeposit.processedBy && (
                <div className="bg-gray-750 rounded-xl p-4 border border-gray-700">
                  <p className="text-gray-400 text-sm mb-1">Processed By</p>
                  <p className="text-white font-semibold">{selectedDeposit.processedBy.name}</p>
                  <p className="text-gray-400 text-sm">{new Date(selectedDeposit.processedAt).toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-800 p-6 border-t border-gray-700 flex gap-3">
              {selectedDeposit.status === 'pending' ? (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="flex-1 bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 disabled:opacity-50 font-bold text-lg flex items-center justify-center gap-2 transition-all"
                  >
                    {processing ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    className="flex-1 bg-red-600 text-white py-4 rounded-xl hover:bg-red-700 disabled:opacity-50 font-bold text-lg flex items-center justify-center gap-2 transition-all"
                  >
                    {processing ? <FaSpinner className="animate-spin" /> : <FaTimes />}
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-700 text-white py-4 rounded-xl hover:bg-gray-600 font-bold text-lg transition-all"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deposits;
