import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaSpinner, FaTimesCircle } from 'react-icons/fa';
import axios from 'axios';
import useAuthStore from '../store/authStore';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fetchUser } = useAuthStore();
  const [status, setStatus] = useState('checking'); // checking, success, failed
  const [message, setMessage] = useState('Verifying your payment...');
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 10; // 10 retries * 3 seconds = 30 seconds max

  useEffect(() => {
    const orderId = searchParams.get('order_id') || searchParams.get('orderId');
    
    if (orderId) {
      checkPaymentStatus(orderId);
    } else {
      setStatus('failed');
      setMessage('Invalid payment reference');
    }
  }, [searchParams]);

  const checkPaymentStatus = async (orderId) => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;

      const response = await axios.get(
        `/payment/deposit/status/${orderId}`,
        {
          baseURL: import.meta.env.VITE_API_URL,
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        const depositStatus = response.data.data.status;
        
        if (depositStatus === 'approved') {
          setStatus('success');
          setMessage('Payment successful! Money added to your wallet.');
          await fetchUser();
          setTimeout(() => navigate('/wallet'), 3000);
        } else if (depositStatus === 'processing') {
          // Check if we've exceeded max retries
          if (retryCount >= MAX_RETRIES) {
            setStatus('failed');
            setMessage('Payment verification timeout. Please check payment history or contact support.');
            setTimeout(() => navigate('/payment-history'), 5000);
          } else {
            setStatus('processing');
            setMessage(`Payment is being processed. Please wait... (${retryCount + 1}/${MAX_RETRIES})`);
            setRetryCount(prev => prev + 1);
            // Retry after 3 seconds
            setTimeout(() => checkPaymentStatus(orderId), 3000);
          }
        } else {
          setStatus('failed');
          setMessage('Payment failed or cancelled');
          setTimeout(() => navigate('/deposit'), 3000);
        }
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setStatus('failed');
      setMessage('Failed to verify payment. Please contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-[#e8f5d0] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
      >
        {status === 'checking' || status === 'processing' ? (
          <>
            <FaSpinner className="text-6xl text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing Payment</h2>
            <p className="text-gray-600">{message}</p>
          </>
        ) : status === 'success' ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to wallet...</p>
          </>
        ) : (
          <>
            <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => navigate('/deposit')}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-all"
            >
              Try Again
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
