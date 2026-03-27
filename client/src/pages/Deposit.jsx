import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaWallet, FaHistory, FaInfoCircle, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';
import useAuthStore from '../store/authStore';

const Deposit = () => {
  const navigate = useNavigate();
  const { user, fetchUser } = useAuthStore();
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [amount, setAmount] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!paymentSettings?.isDepositEnabled) {
      toast.error('Deposits are currently disabled');
      return;
    }

    const depositAmount = parseFloat(amount);

    if (!depositAmount || depositAmount < paymentSettings.minDeposit || depositAmount > paymentSettings.maxDeposit) {
      toast.error(`Amount must be between ₹${paymentSettings.minDeposit} and ₹${paymentSettings.maxDeposit}`);
      return;
    }

    setLoading(true);
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;
      
      const response = await axios.post(
        '/payment/deposit',
        { amount: depositAmount },
        {
          baseURL: import.meta.env.VITE_API_URL,
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success && response.data.data.paymentUrl) {
        toast.success('Redirecting to payment gateway...', {
          icon: '🚀'
        });
        
        // Redirect to payment gateway
        window.location.href = response.data.data.paymentUrl;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create payment order');
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
            <span className="text-4xl">💰</span>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
              Add Money
            </h1>
          </div>
          <button
            onClick={() => navigate('/payment-history')}
            className="bg-blue-500 backdrop-blur-sm border border-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg"
          >
            <FaHistory /> History
          </button>
        </div>

        {!paymentSettings.isDepositEnabled && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-500/20 border-2 border-red-500 text-red-400 p-4 rounded-2xl mb-6 flex items-center gap-3"
          >
            <FaInfoCircle className="text-2xl" />
            <p className="font-semibold">Deposits are currently disabled. Please try again later.</p>
          </motion.div>
        )}

        {/* Balance Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 mb-6 border-2 border-blue-400 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-white/20 p-4 rounded-2xl">
              <FaWallet className="text-4xl text-white" />
            </div>
            <div>
              <h2 className="text-white/90 text-lg font-semibold">Current Balance</h2>
              <p className="text-5xl font-black text-white">₹{user?.depositCash || 0}</p>
            </div>
          </div>
          <p className="text-white/80 text-sm bg-white/10 rounded-xl p-3 mt-4">
            💡 Add money instantly via secure payment gateway
          </p>
        </motion.div>

        {/* Deposit Form */}
        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl p-6 border-2 border-gray-700 space-y-6"
        >
          <h2 className="text-2xl font-black text-white mb-4">Add Money</h2>

          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-3">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min: ₹${paymentSettings.minDeposit}, Max: ₹${paymentSettings.maxDeposit}`}
              className="w-full px-5 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-2xl text-white text-lg font-bold focus:outline-none focus:border-green-500 transition-all"
              required
              min={paymentSettings.minDeposit}
              max={paymentSettings.maxDeposit}
              disabled={loading}
            />
            
            <div className="grid grid-cols-3 gap-2 mt-3">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt.toString())}
                  disabled={loading}
                  className="bg-gray-700/50 hover:bg-green-500/30 border border-gray-600 hover:border-green-500 text-white py-2 rounded-xl font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-500/10 border-2 border-blue-500 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <FaCheckCircle className="text-blue-400 text-xl mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-blue-400 font-bold mb-2">Instant & Secure Payment</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>✓ Instant credit after successful payment</li>
                  <li>✓ 100% secure payment gateway</li>
                  <li>✓ Multiple payment options (UPI, Cards, Net Banking)</li>
                  <li>✓ No manual verification needed</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !paymentSettings.isDepositEnabled}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-5 rounded-2xl font-black text-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl transition-all transform hover:scale-105"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <FaSpinner className="animate-spin" />
                Processing...
              </span>
            ) : (
              'Proceed to Payment'
            )}
          </button>
        </motion.form>
      </div>
    </div>
  );
};

export default Deposit;
