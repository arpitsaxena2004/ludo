import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import axios from 'axios';

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(searchParams.get('blocked') === 'true');
  const [signupBonus, setSignupBonus] = useState(50);

  // Fetch signup bonus from config
  useEffect(() => {
    const fetchSignupBonus = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/config/public/signupBonus`);
        if (response.data.success) {
          setSignupBonus(response.data.data.value);
        }
      } catch (error) {
        console.error('Failed to fetch signup bonus:', error);
      }
    };
    fetchSignupBonus();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(phoneNumber, password);
      setAuth(response.data.user, response.data.token);
      toast.success(response.data.message);
      navigate('/');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to login';
      
      if (error.response?.status === 403 || errorMessage.includes('blocked')) {
        setShowBlockedModal(true);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register(phoneNumber, password, referralCode);
      setAuth(response.data.user, response.data.token);
      toast.success(response.data.message);
      toast.success(`You received ₹${signupBonus} bonus!`, { duration: 5000 });
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8f5d0] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-64 h-64 bg-green-400 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="relative mx-auto mb-6 inline-block"
          >
            <img src="/logo.png" alt="A2Z LUDO" className="w-20 h-20 object-contain" />
          </motion.div>
          <h1 className="text-4xl font-black text-gray-800 mb-2">
            A2Z LUDO
          </h1>
          <p className="text-gray-600 text-lg font-semibold">
            Turn Fun Into Funds
          </p>
        </div>

        {/* Form Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-gray-200"
        >
          {/* Toggle Buttons */}
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                isLogin 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                !isLogin 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={isLogin ? handleLogin : handleRegister}>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isLogin ? 'Login to continue playing' : 'Sign up to start winning'}
            </p>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium text-sm">
                Mobile Number
              </label>
              <div className="flex items-center bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-300 focus-within:border-orange-500 transition-colors">
                <span className="px-4 text-gray-700 font-semibold">+91</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit number"
                  className="flex-1 bg-transparent px-4 py-4 text-gray-800 outline-none placeholder-gray-400"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium text-sm">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (min 6 characters)"
                  className="w-full bg-gray-50 border-2 border-gray-300 px-4 py-4 pr-12 rounded-xl text-gray-800 outline-none focus:border-orange-500 transition-colors placeholder-gray-400"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium text-sm">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full bg-gray-50 border-2 border-gray-300 px-4 py-4 pr-12 rounded-xl text-gray-800 outline-none focus:border-orange-500 transition-colors placeholder-gray-400"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 mb-2 font-medium text-sm">
                    Referral Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="Enter referral code"
                    className="w-full bg-gray-50 border-2 border-gray-300 px-4 py-4 rounded-xl text-gray-800 outline-none focus:border-orange-500 transition-colors placeholder-gray-400"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg py-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 mt-6"
            >
              {loading ? (isLogin ? 'Logging in...' : 'Creating Account...') : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </form>
        </motion.div>

        {/* Welcome Bonus Banner */}
        {!isLogin && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-4 text-white text-center shadow-xl"
          >
            <p className="font-bold">🎁 Get ₹{signupBonus} Welcome Bonus on Sign Up!</p>
          </motion.div>
        )}

        <p className="text-center text-gray-600 text-sm mt-6 font-medium">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </motion.div>

      {/* Blocked Account Modal */}
      {showBlockedModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-red-900 to-red-800 rounded-3xl p-6 w-full max-w-md border-2 border-red-500 shadow-2xl"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🚫</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Account Blocked</h3>
              <p className="text-red-100 mb-6">
                Your account has been blocked by the administrator. 
                Please contact support for assistance.
              </p>
              <div className="space-y-3">
                <a
                  href="mailto:support@a2zludo.com"
                  className="block w-full bg-white text-red-600 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Contact Support
                </a>
                <button
                  onClick={() => {
                    setShowBlockedModal(false);
                    setPhoneNumber('');
                    setPassword('');
                  }}
                  className="w-full bg-red-700 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Login;
