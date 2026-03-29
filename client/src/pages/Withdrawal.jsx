import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaWallet, FaHistory, FaInfoCircle, FaCheckCircle, FaQrcode, FaUniversity } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';
import useAuthStore from '../store/authStore';

const Withdrawal = () => {
  const navigate = useNavigate();
  const { user, fetchUser, fetchBalance } = useAuthStore();
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPaymentSettings();
    fetchBalance(); // Initial balance fetch
    
    const balanceInterval = setInterval(fetchBalance, 2000); // Update balance every 2 seconds
    
    // Auto-select first available account
    if (user?.upiId) {
      setSelectedAccount('upi');
    } else if (user?.bankDetails?.accountNumber) {
      setSelectedAccount('bank');
    }
    
    return () => clearInterval(balanceInterval);
  }, [user, fetchBalance]);

  const fetchPaymentSettings = async () => {
    try {
      const response = await axios.get('/payment/settings', {
        baseURL: import.meta.env.VITE_API_URL
      });
      setPaymentSettings(response.data.data);
    } catch (error) {
      toast.error('Failed to load payment settings');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!paymentSettings?.isWithdrawalEnabled) {
      toast.error('Withdrawals are currently disabled');
      return;
    }

    if (!selectedAccount) {
      toast.error('Please select a payment account');
      return;
    }

    const withdrawAmount = parseFloat(amount);

    if (!withdrawAmount || withdrawAmount < paymentSettings.minWithdrawal || withdrawAmount > paymentSettings.maxWithdrawal) {
      toast.error(`Amount must be between ₹${paymentSettings.minWithdrawal} and ₹${paymentSettings.maxWithdrawal}`);
      return;
    }

    if (withdrawAmount > user.winningCash) {
      toast.error(`Insufficient winning balance. Available: ₹${user.winningCash}`);
      return;
    }

    // Prepare withdrawal details based on selected account
    let paymentMethod = 'upi';
    let withdrawalDetails = {};
    
    if (selectedAccount === 'upi') {
      if (!user?.upiId) {
        toast.error('UPI ID not found. Please add it in your profile.');
        return;
      }
      paymentMethod = 'upi';
      withdrawalDetails = { upiId: user.upiId };
    } else if (selectedAccount === 'bank') {
      if (!user?.bankDetails?.accountNumber || !user?.bankDetails?.ifscCode) {
        toast.error('Bank details not found. Please add them in your profile.');
        return;
      }
      paymentMethod = 'bank';
      withdrawalDetails = {
        accountHolderName: user.bankDetails.accountHolderName,
        accountNumber: user.bankDetails.accountNumber,
        ifscCode: user.bankDetails.ifscCode,
        bankName: user.bankDetails.bankName
      };
    }

    setLoading(true);
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;
      
      const response = await axios.post(
        '/payment/withdrawal',
        {
          amount: withdrawAmount,
          paymentMethod,
          withdrawalDetails
        },
        {
          baseURL: import.meta.env.VITE_API_URL,
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Immediately update the UI with reduced balance
        const updatedUser = {
          ...user,
          winningCash: user.winningCash - withdrawAmount
        };
        useAuthStore.setState({ user: updatedUser });
        
        toast.success('Withdrawal request submitted! 🎉', {
          duration: 4000,
          icon: '✅'
        });
        setAmount('');
        setSelectedAccount('');
        
        // Fetch fresh user data from server
        await fetchUser();
        
        setTimeout(() => navigate('/payment-history'), 1500);
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit withdrawal request';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  if (!paymentSettings) {
    return (
      <div className="min-h-screen bg-[#e8f5d0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8f5d0] p-3 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💸</span>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
              Withdraw Money
            </h1>
          </div>
          <button
            onClick={() => navigate('/payment-history')}
            className="bg-blue-500 backdrop-blur-sm border border-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-all flex items-center gap-1.5 shadow-lg text-sm"
          >
            <FaHistory className="text-sm" /> History
          </button>
        </div>

        {!paymentSettings.isWithdrawalEnabled && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-500/20 border-2 border-red-500 text-red-400 p-3 rounded-xl mb-3 flex items-center gap-2 text-sm"
          >
            <FaInfoCircle className="text-lg" />
            <p className="font-semibold">Withdrawals are currently disabled. Please try again later.</p>
          </motion.div>
        )}

        {/* Balance Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl p-4 mb-3 border-2 border-green-400 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2.5 rounded-xl">
              <FaWallet className="text-2xl text-white" />
            </div>
            <div>
              <h2 className="text-white/90 text-sm font-semibold">Available Winning Balance</h2>
              <p className="text-3xl font-black text-white">₹{user?.winningCash || 0}</p>
            </div>
          </div>
          <p className="text-white/80 text-xs bg-white/10 rounded-lg p-2">
            💡 Only winning cash can be withdrawn
          </p>
        </motion.div>

        {/* Withdrawal Form */}
        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-gray-700 space-y-4"
        >
          <h2 className="text-lg font-black text-white mb-2">Withdrawal Request</h2>

          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-3">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min: ₹${paymentSettings.minWithdrawal}, Max: ₹${paymentSettings.maxWithdrawal}`}
              className="w-full px-5 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-2xl text-white text-lg font-bold focus:outline-none focus:border-blue-500 transition-all"
              required
              min={paymentSettings.minWithdrawal}
              max={Math.min(paymentSettings.maxWithdrawal, user?.winningCash || 0)}
            />
            
            <div className="grid grid-cols-3 gap-2 mt-3">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt.toString())}
                  disabled={amt > (user?.winningCash || 0)}
                  className="bg-gray-700/50 hover:bg-blue-500/30 border border-gray-600 hover:border-blue-500 text-white py-2 rounded-xl font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-3">Select Payment Account</label>
            
            {/* Check if user has any saved accounts */}
            {!user?.upiId && !user?.bankDetails?.accountNumber ? (
              <div className="bg-yellow-500/10 border-2 border-yellow-500 rounded-2xl p-6 text-center">
                <FaInfoCircle className="text-4xl text-yellow-400 mx-auto mb-3" />
                <p className="text-yellow-400 font-semibold mb-3">No payment accounts found!</p>
                <p className="text-gray-300 text-sm mb-4">Please add your UPI ID or Bank details in your profile to withdraw money.</p>
                <Link 
                  to="/profile"
                  className="inline-block bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-all"
                >
                  Go to Profile
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {/* UPI Account Option */}
                {user?.upiId && (
                  <div
                    onClick={() => setSelectedAccount('upi')}
                    className={`cursor-pointer bg-gray-700/50 border-2 rounded-2xl p-4 transition-all ${
                      selectedAccount === 'upi'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedAccount === 'upi' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}>
                        <FaQrcode className="text-white text-xl" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-lg">UPI Account</p>
                        <p className="text-gray-400 text-sm font-mono">{user.upiId}</p>
                      </div>
                      {selectedAccount === 'upi' && (
                        <FaCheckCircle className="text-blue-500 text-2xl" />
                      )}
                    </div>
                  </div>
                )}

                {/* Bank Account Option */}
                {user?.bankDetails?.accountNumber && (
                  <div
                    onClick={() => setSelectedAccount('bank')}
                    className={`cursor-pointer bg-gray-700/50 border-2 rounded-2xl p-4 transition-all ${
                      selectedAccount === 'bank'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedAccount === 'bank' ? 'bg-blue-500' : 'bg-green-500'
                      }`}>
                        <FaUniversity className="text-white text-xl" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-lg">Bank Account</p>
                        <p className="text-gray-400 text-sm">{user.bankDetails.accountHolderName}</p>
                        <p className="text-gray-400 text-xs font-mono">A/C: {user.bankDetails.accountNumber}</p>
                        <p className="text-gray-400 text-xs font-mono">
                          {user.bankDetails.ifscCode}
                          {user.bankDetails.bankName && ` | ${user.bankDetails.bankName}`}
                        </p>
                      </div>
                      {selectedAccount === 'bank' && (
                        <FaCheckCircle className="text-blue-500 text-2xl" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !paymentSettings.isWithdrawalEnabled || (user?.winningCash || 0) < paymentSettings.minWithdrawal || !selectedAccount}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl transition-all transform hover:scale-105"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting...
              </span>
            ) : (
              'Submit Withdrawal Request'
            )}
          </button>
        </motion.form>
      </div>
    </div>
  );
};

export default Withdrawal;
