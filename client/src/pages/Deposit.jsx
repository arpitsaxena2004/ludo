import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaQrcode, FaCopy, FaUpload, FaHistory, FaCheckCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';

const Deposit = () => {
  const navigate = useNavigate();
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [amount, setAmount] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

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

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!', { icon: '📋' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const handleContinue = () => {
    if (!amount || parseFloat(amount) < paymentSettings.minDeposit || parseFloat(amount) > paymentSettings.maxDeposit) {
      toast.error(`Amount must be between ₹${paymentSettings.minDeposit} and ₹${paymentSettings.maxDeposit}`);
      return;
    }
    setShowQRModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!paymentSettings?.isDepositEnabled) {
      toast.error('Deposits are currently disabled');
      return;
    }

    if (!screenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('screenshot', screenshot);
      formData.append('upiTransactionId', upiTransactionId);

      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;
      await axios.post('/payment/deposit', formData, {
        baseURL: import.meta.env.VITE_API_URL,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Deposit request submitted! 🎉', {
        duration: 4000,
        icon: '✅'
      });
      setAmount('');
      setScreenshot(null);
      setScreenshotPreview('');
      setUpiTransactionId('');
      setShowQRModal(false);
      
      setTimeout(() => navigate('/payment-history'), 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit deposit request');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000, 10000];

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

        {/* Amount Entry Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl p-6 border-2 border-gray-700 space-y-6"
        >
          <h2 className="text-2xl font-black text-white mb-4">Enter Deposit Amount</h2>

          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-3">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min: ₹${paymentSettings.minDeposit}, Max: ₹${paymentSettings.maxDeposit}`}
              className="w-full px-5 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-2xl text-white text-lg font-bold focus:outline-none focus:border-green-500 transition-all"
              min={paymentSettings.minDeposit}
              max={paymentSettings.maxDeposit}
            />
            
            <div className="grid grid-cols-3 gap-2 mt-3">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt.toString())}
                  className="bg-gray-700/50 hover:bg-green-500/30 border border-gray-600 hover:border-green-500 text-white py-2 rounded-xl font-semibold transition-all"
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!paymentSettings.isDepositEnabled}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-5 rounded-2xl font-black text-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl transition-all transform hover:scale-105"
          >
            Continue to Payment
          </button>
        </motion.div>

        {/* QR Code Modal */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-700 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <FaQrcode className="text-green-400" /> Payment Details
                </h2>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-xl p-3 mb-6">
                <p className="text-yellow-300 text-sm font-semibold text-center">
                  Amount to Pay: ₹{amount}
                </p>
              </div>

              {/* QR Code */}
              {paymentSettings.qrCode && (
                <div className="flex justify-center mb-6">
                  <div className="bg-white p-6 rounded-2xl shadow-2xl">
                    <img src={paymentSettings.qrCode} alt="QR Code" className="w-64 h-64 object-contain" />
                  </div>
                </div>
              )}

              {/* UPI Details */}
              <div className="space-y-4 mb-6">
                {paymentSettings.upiId && (
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-2xl p-4">
                    <p className="text-gray-400 text-sm mb-2 font-semibold">UPI ID</p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-white font-mono text-lg font-bold break-all">{paymentSettings.upiId}</p>
                      <button
                        onClick={() => handleCopy(paymentSettings.upiId)}
                        className="bg-green-500 text-white p-3 rounded-xl hover:bg-green-600 transition-all flex-shrink-0"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                )}

                {paymentSettings.upiNumber && (
                  <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-2 border-blue-500/50 rounded-2xl p-4">
                    <p className="text-gray-400 text-sm mb-2 font-semibold">UPI Number</p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-white font-mono text-lg font-bold">{paymentSettings.upiNumber}</p>
                      <button
                        onClick={() => handleCopy(paymentSettings.upiNumber)}
                        className="bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 transition-all flex-shrink-0"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Below QR */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-3">UPI Transaction ID (Optional)</label>
                  <input
                    type="text"
                    value={upiTransactionId}
                    onChange={(e) => setUpiTransactionId(e.target.value)}
                    placeholder="Enter transaction ID from payment app"
                    className="w-full px-5 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-2xl text-white focus:outline-none focus:border-green-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-3">Payment Screenshot *</label>
                  <div className="border-4 border-dashed border-gray-600 rounded-2xl p-8 text-center hover:border-green-500 transition-all">
                    {screenshotPreview ? (
                      <div className="space-y-4">
                        <img src={screenshotPreview} alt="Preview" className="max-h-80 mx-auto rounded-2xl shadow-2xl" />
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshot(null);
                            setScreenshotPreview('');
                          }}
                          className="text-red-400 hover:text-red-300 font-semibold"
                        >
                          Remove Screenshot
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <FaUpload className="mx-auto text-6xl text-gray-400 mb-4" />
                        <p className="text-white font-semibold text-lg mb-2">Click to upload screenshot</p>
                        <p className="text-gray-400 text-sm">PNG, JPG up to 5MB</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          required
                        />
                      </label>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-5 rounded-2xl font-black text-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl transition-all transform hover:scale-105"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Deposit Request'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Deposit;
