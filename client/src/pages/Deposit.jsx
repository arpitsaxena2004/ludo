import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaWallet, FaHistory, FaInfoCircle, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';
import useAuthStore from '../store/authStore';

const Deposit = () => {
  const navigate = useNavigate();
  const { user, fetchUser, fetchBalance } = useAuthStore();
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPaymentSettings();
    fetchBalance(); // Initial balance fetch
    
    const balanceInterval = setInterval(fetchBalance, 2000); // Update balance every 2 seconds
    
    return () => clearInterval(balanceInterval);
  }, [fetchBalance]);

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
    <div className="min-h-screen bg-[#e8f5d0] p-3 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
              Add Money
            </h1>
          </div>
          <button
            onClick={() => navigate('/payment-history')}
            className="bg-blue-500 backdrop-blur-sm border border-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-all flex items-center gap-1.5 shadow-lg text-sm"
          >
            <FaHistory className="text-sm" /> History
          </button>
        </div>

        {!paymentSettings.isDepositEnabled && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-500/20 border-2 border-red-500 text-red-400 p-3 rounded-xl mb-3 flex items-center gap-2 text-sm"
          >
            <FaInfoCircle className="text-lg" />
            <p className="font-semibold">Deposits are currently disabled. Please try again later.</p>
          </motion.div>
        )}

        {/* Balance Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-4 mb-3 border-2 border-blue-400 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2.5 rounded-xl">
              <FaWallet className="text-2xl text-white" />
            </div>
            <div>
              <h2 className="text-white/90 text-sm font-semibold">Current Balance</h2>
              <p className="text-3xl font-black text-white">₹{user?.depositCash || 0}</p>
            </div>
          </div>
          <p className="text-white/80 text-xs bg-white/10 rounded-lg p-2">
            💡 Add money instantly via secure payment gateway
          </p>
        </motion.div>

        {/* Deposit Form */}
        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-gray-700 space-y-4"
        >
          <h2 className="text-lg font-black text-white mb-2">Add Money</h2>

          <div>
            <label className="block text-gray-300 text-xs font-semibold mb-2">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min: ₹${paymentSettings.minDeposit}, Max: ₹${paymentSettings.maxDeposit}`}
              className="w-full px-3 py-2.5 bg-gray-700/50 border-2 border-gray-600 rounded-xl text-white text-base font-bold focus:outline-none focus:border-green-500 transition-all"
              required
              min={paymentSettings.minDeposit}
              max={paymentSettings.maxDeposit}
              disabled={loading}
            />
            
            <div className="grid grid-cols-3 gap-2 mt-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt.toString())}
                  disabled={loading}
                  className="bg-gray-700/50 hover:bg-green-500/30 border border-gray-600 hover:border-green-500 text-white py-1.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-500/10 border-2 border-blue-500 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <FaCheckCircle className="text-blue-400 text-base mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-blue-400 font-bold text-sm mb-1">Instant & Secure Payment</h3>
                <ul className="text-gray-300 text-xs space-y-0.5">
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
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-black text-base hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transition-all transform hover:scale-105"
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
