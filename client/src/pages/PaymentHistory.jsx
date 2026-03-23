import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaClock, FaTimesCircle, FaArrowDown, FaArrowUp } from 'react-icons/fa';
import axios from 'axios';

const PaymentHistory = () => {
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [activeTab, setActiveTab] = useState('deposits');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;
      
      const [depositsRes, withdrawalsRes] = await Promise.all([
        axios.get('/payment/deposit/history', {
          baseURL: import.meta.env.VITE_API_URL,
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/payment/withdrawal/history', {
          baseURL: import.meta.env.VITE_API_URL,
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setDeposits(depositsRes.data.data);
      setWithdrawals(withdrawalsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: FaClock, label: 'Under Review' },
      approved: { bg: 'bg-green-500/20', text: 'text-green-400', icon: FaCheckCircle, label: 'Approved' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: FaTimesCircle, label: 'Rejected' }
    };
    const badge = badges[status];
    const Icon = badge.icon;
    return (
      <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit`}>
        <Icon className="text-sm" /> {badge.label}
      </span>
    );
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      upi: 'UPI',
      phonepe: 'PhonePe',
      googlepay: 'Google Pay',
      paytm: 'Paytm',
      bank: 'Bank Transfer'
    };
    return labels[method] || method;
  };

  return (
    <div className="min-h-screen bg-[#e8f5d0] p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">📜</span>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            Payment History
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('deposits')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'deposits'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            <FaArrowDown className="inline mr-2" />
            Deposits ({deposits.length})
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'withdrawals'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            <FaArrowUp className="inline mr-2" />
            Withdrawals ({withdrawals.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-400 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading history...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTab === 'deposits' ? (
              deposits.length === 0 ? (
                <div className="text-center py-20">
                  <span className="text-6xl mb-4 block">💰</span>
                  <p className="text-gray-400 text-lg">No deposit history yet</p>
                </div>
              ) : (
                deposits.map((deposit, index) => (
                  <motion.div
                    key={deposit._id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-5 border-2 border-gray-700 hover:border-green-500/50 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FaArrowDown className="text-green-400" />
                          <span className="text-white font-bold text-xl">₹{deposit.amount}</span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {new Date(deposit.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </p>
                      </div>
                      {getStatusBadge(deposit.status)}
                    </div>
                    
                    {deposit.upiTransactionId && (
                      <div className="bg-gray-700/50 rounded-lg p-2 mb-2">
                        <p className="text-gray-400 text-xs">Transaction ID</p>
                        <p className="text-white text-sm font-mono">{deposit.upiTransactionId}</p>
                      </div>
                    )}
                    
                    {deposit.adminNotes && deposit.status !== 'pending' && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-2">
                        <p className="text-blue-400 text-xs font-semibold mb-1">Admin Note:</p>
                        <p className="text-gray-300 text-sm">{deposit.adminNotes}</p>
                      </div>
                    )}
                  </motion.div>
                ))
              )
            ) : (
              withdrawals.length === 0 ? (
                <div className="text-center py-20">
                  <span className="text-6xl mb-4 block">💸</span>
                  <p className="text-gray-400 text-lg">No withdrawal history yet</p>
                </div>
              ) : (
                withdrawals.map((withdrawal, index) => (
                  <motion.div
                    key={withdrawal._id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-5 border-2 border-gray-700 hover:border-blue-500/50 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FaArrowUp className="text-blue-400" />
                          <span className="text-white font-bold text-xl">₹{withdrawal.amount}</span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {new Date(withdrawal.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </p>
                      </div>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                    
                    <div className="bg-gray-700/50 rounded-lg p-3 mb-2">
                      <p className="text-gray-400 text-xs mb-2">Payment Method</p>
                      <p className="text-white font-semibold">{getPaymentMethodLabel(withdrawal.paymentMethod)}</p>
                      
                      {withdrawal.withdrawalDetails?.upiId && (
                        <p className="text-gray-300 text-sm mt-1">UPI: {withdrawal.withdrawalDetails.upiId}</p>
                      )}
                      {withdrawal.withdrawalDetails?.accountNumber && (
                        <p className="text-gray-300 text-sm mt-1">
                          A/C: ****{withdrawal.withdrawalDetails.accountNumber.slice(-4)}
                        </p>
                      )}
                    </div>
                    
                    {withdrawal.adminNotes && withdrawal.status !== 'pending' && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-2">
                        <p className="text-blue-400 text-xs font-semibold mb-1">Admin Note:</p>
                        <p className="text-gray-300 text-sm">{withdrawal.adminNotes}</p>
                      </div>
                    )}
                  </motion.div>
                ))
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
