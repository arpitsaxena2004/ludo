import { useState, useEffect } from 'react';
import { FaSearch, FaCheck, FaTimes, FaEye, FaArrowUp, FaArrowDown, FaFilter, FaDownload } from 'react-icons/fa';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTransactions(1, 50, filter !== 'all' ? filter : '');
      // Map 'user' to 'userId' for consistency
      const mappedTransactions = (response.data.transactions || []).map(txn => ({
        ...txn,
        userId: txn.user || txn.userId
      }));
      setTransactions(mappedTransactions);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminAPI.updateTransaction(id, 'completed', 'Approved by admin');
      toast.success('Withdrawal approved');
      fetchTransactions();
      setSelectedTxn(null);
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await adminAPI.updateTransaction(id, 'failed', 'Rejected by admin');
      toast.success('Withdrawal rejected');
      fetchTransactions();
      setSelectedTxn(null);
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeColor = (type) => {
    return type === 'deposit' ? 'text-green-400' : 'text-red-400';
  };

  const getTypeIcon = (type) => {
    return type === 'deposit' ? <FaArrowDown className="text-green-400" /> : <FaArrowUp className="text-red-400" />;
  };

  const filteredTransactions = transactions
    .filter(txn => txn.type !== 'game_entry' && txn.type !== 'game_win') // Exclude game transactions
    .filter(txn => 
      txn.userId?.phoneNumber?.includes(searchTerm) || 
      txn.userId?.username?.includes(searchTerm) ||
      txn.amount?.toString().includes(searchTerm)
    );

  const stats = {
    total: filteredTransactions.length,
    deposits: filteredTransactions.filter(t => t.type === 'deposit').length,
    withdrawals: filteredTransactions.filter(t => t.type === 'withdrawal').length,
    pending: filteredTransactions.filter(t => t.status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Transactions</h1>
          <p className="text-gray-400">Manage all platform transactions</p>
        </div>
        <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all flex items-center gap-2 w-fit">
          <FaDownload />
          Export Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-4 lg:p-6">
          <p className="text-blue-400 text-sm mb-1">Total</p>
          <p className="text-white text-2xl lg:text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-4 lg:p-6">
          <p className="text-green-400 text-sm mb-1">Deposits</p>
          <p className="text-white text-2xl lg:text-3xl font-bold">{stats.deposits}</p>
        </div>
        <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-500/30 rounded-xl p-4 lg:p-6">
          <p className="text-red-400 text-sm mb-1">Withdrawals</p>
          <p className="text-white text-2xl lg:text-3xl font-bold">{stats.withdrawals}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-xl p-4 lg:p-6">
          <p className="text-yellow-400 text-sm mb-1">Pending</p>
          <p className="text-white text-2xl lg:text-3xl font-bold">{stats.pending}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by phone, username or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
          <FaFilter className="text-gray-400 flex-shrink-0" />
          {['all', 'deposit', 'withdrawal', 'pending', 'completed', 'failed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm capitalize transition-all flex-shrink-0 font-medium ${
                filter === f
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedTxn(null)}>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 lg:p-8 w-full max-w-lg border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Transaction Details</h3>
              <button 
                onClick={() => setSelectedTxn(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">Transaction Type</p>
                <div className="flex items-center gap-2">
                  {getTypeIcon(selectedTxn.type)}
                  <p className={`capitalize font-bold text-xl ${getTypeColor(selectedTxn.type)}`}>{selectedTxn.type}</p>
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">Amount</p>
                <p className="text-white font-bold text-3xl">₹{selectedTxn.amount}</p>
              </div>
              
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">Status</p>
                <span className={`px-4 py-2 rounded-lg text-sm font-semibold border inline-block ${getStatusColor(selectedTxn.status)}`}>
                  {selectedTxn.status}
                </span>
              </div>
              
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">User</p>
                <div>
                  <p className="text-white font-semibold text-lg">
                    {selectedTxn.userId?.username || selectedTxn.userId?.phoneNumber || 'N/A'}
                  </p>
                  {selectedTxn.userId?.username && selectedTxn.userId?.phoneNumber && (
                    <p className="text-gray-400 text-sm mt-1">{selectedTxn.userId.phoneNumber}</p>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">Date & Time</p>
                <p className="text-white font-semibold">{new Date(selectedTxn.createdAt).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedTxn(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Close
              </button>
              {selectedTxn.type === 'withdrawal' && selectedTxn.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleApprove(selectedTxn._id)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-green-500/30"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedTxn._id)}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-red-500/30"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading transactions...</p>
          </div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl p-12 border border-gray-700 text-center">
          <div className="text-6xl mb-4">💳</div>
          <p className="text-gray-400 text-lg">No transactions found</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredTransactions.map((txn) => (
              <div key={txn._id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-all shadow-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${txn.type === 'deposit' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      {getTypeIcon(txn.type)}
                    </div>
                    <div>
                      <p className={`font-bold capitalize text-lg ${getTypeColor(txn.type)}`}>
                        {txn.type}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {txn.userId?.username || txn.userId?.phoneNumber || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(txn.status)}`}>
                    {txn.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3 pt-3 border-t border-gray-700">
                  <p className="text-white font-bold text-2xl">₹{txn.amount}</p>
                  <p className="text-gray-400 text-sm">{new Date(txn.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTxn(txn)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <FaEye /> View
                  </button>
                  {txn.type === 'withdrawal' && txn.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(txn._id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <FaCheck /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(txn._id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <FaTimes /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-900 to-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-white text-sm font-semibold">User</th>
                    <th className="px-6 py-4 text-left text-white text-sm font-semibold">Type</th>
                    <th className="px-6 py-4 text-left text-white text-sm font-semibold">Amount</th>
                    <th className="px-6 py-4 text-left text-white text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-white text-sm font-semibold">Date</th>
                    <th className="px-6 py-4 text-left text-white text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((txn, index) => (
                    <tr key={txn._id} className={`border-t border-gray-700 hover:bg-gray-700/50 transition-colors ${index % 2 === 0 ? 'bg-gray-800/50' : ''}`}>
                      <td className="px-6 py-4 text-white font-medium">
                        {txn.userId?.username || txn.userId?.phoneNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(txn.type)}
                          <span className={`capitalize font-semibold ${getTypeColor(txn.type)}`}>{txn.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white font-bold text-lg">₹{txn.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${getStatusColor(txn.status)}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{new Date(txn.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedTxn(txn)}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                          >
                            View
                          </button>
                          {txn.type === 'withdrawal' && txn.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(txn._id)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(txn._id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Transactions;
