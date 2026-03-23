import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaWallet, FaHistory, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';
import useAuthStore from '../store/authStore';

const Withdrawal = () => {
  const navigate = useNavigate();
  const { user, fetchUser } = useAuthStore();
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [withdrawalDetails, setWithdrawalDetails] = useState({
    upiId: '',
    phoneNumber: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

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

  const handleInputChange = (e) => {
    setWithdrawalDetails({
      ...withdrawalDetails,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!paymentSettings?.isWithdrawalEnabled) {
      toast.error('Withdrawals are currently disabled');
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

    if (['upi', 'phonepe', 'googlepay', 'paytm'].includes(paymentMethod)) {
      if (!withdrawalDetails.upiId && !withdrawalDetails.phoneNumber) {
        toast.error('Please provide UPI ID or Phone Number');
        return;
      }
    } else if (paymentMethod === 'bank') {
      if (!withdrawalDetails.accountHolderName || !withdrawalDetails.accountNumber || !withdrawalDetails.ifscCode) {
        toast.error('Please provide complete bank details');
        return;
      }
    }

    setLoading(true);
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;
      await axios.post(
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

      toast.success('Withdrawal request submitted! 🎉', {
        duration: 4000,
        icon: '✅'
      });
      setAmount('');
      setWithdrawalDetails({
        upiId: '',
        phoneNumber: '',
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: ''
      });
      fetchUser();
      
      setTimeout(() => navigate('/payment-history'), 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit withdrawal request');
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
    <div className="min-h-screen bg-[#e8f5d0] p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">💸</span>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
              Withdraw Money
            </h1>
          </div>
          <button
            onClick={() => navigate('/payment-history')}
            className="bg-blue-500 backdrop-blur-sm border border-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg"
          >
            <FaHistory /> History
          </button>
        </div>

        {!paymentSettings.isWithdrawalEnabled && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-500/20 border-2 border-red-500 text-red-400 p-4 rounded-2xl mb-6 flex items-center gap-3"
          >
            <FaInfoCircle className="text-2xl" />
            <p className="font-semibold">Withdrawals are currently disabled. Please try again later.</p>
          </motion.div>
        )}

        {/* Balance Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-green-600 to-teal-600 rounded-3xl p-8 mb-6 border-2 border-green-400 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-white/20 p-4 rounded-2xl">
              <FaWallet className="text-4xl text-white" />
            </div>
            <div>
              <h2 className="text-white/90 text-lg font-semibold">Available Winning Balance</h2>
              <p className="text-5xl font-black text-white">₹{user?.winningCash || 0}</p>
            </div>
          </div>
          <p className="text-white/80 text-sm bg-white/10 rounded-xl p-3 mt-4">
            💡 Only winning cash can be withdrawn
          </p>
        </motion.div>

        {/* Withdrawal Form */}
        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl p-6 border-2 border-gray-700 space-y-6"
        >
          <h2 className="text-2xl font-black text-white mb-4">Withdrawal Request</h2>

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
            <label className="block text-gray-300 text-sm font-semibold mb-3">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-5 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-2xl text-white font-semibold focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="upi">UPI</option>
              <option value="phonepe">PhonePe</option>
              <option value="googlepay">Google Pay</option>
              <option value="paytm">Paytm</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>

          {['upi', 'phonepe', 'googlepay', 'paytm'].includes(paymentMethod) && (
            <>
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-3">UPI ID</label>
                <input
                  type="text"
                  name="upiId"
                  value={withdrawalDetails.upiId}
                  onChange={handleInputChange}
                  placeholder="yourname@upi"
                  className="w-full px-5 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-2xl text-white focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-3">Phone Number (Alternative)</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={withdrawalDetails.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="10-digit mobile number"
                  className="w-full px-5 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-2xl text-white focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </>
          )}

          {paymentMethod === 'bank' && (
            <>
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-3">Account Holder Name *</label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={withdrawalDetails.accountHolderName}
                  onChange={handleInputChange}
                  placeholder="As per bank records"
                  className="w-full px-5 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-2xl text-white focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-3">Account Number *</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={withdrawalDetails.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Bank account number"
                  className="w-full px-5 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-2xl text-white focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-3">IFSC Code *</label>
                <input
                  type="text"
                  name="ifscCode"
                  value={withdrawalDetails.ifscCode}
                  onChange={handleInputChange}
                  placeholder="11-character IFSC code"
                  className="w-full px-5 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-2xl text-white focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-3">Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={withdrawalDetails.bankName}
                  onChange={handleInputChange}
                  placeholder="Name of your bank"
                  className="w-full px-5 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-2xl text-white focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </>
          )}

          

          <button
            type="submit"
            disabled={loading || !paymentSettings.isWithdrawalEnabled || (user?.winningCash || 0) < paymentSettings.minWithdrawal}
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
