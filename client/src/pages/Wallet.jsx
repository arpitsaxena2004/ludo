import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHistory } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const Wallet = () => {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();

  // Fetch balance on mount
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await authAPI.getMe();
        updateUser(response.data.user);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    };
    fetchBalance();
  }, [updateUser]);

  return (
    <div className="min-h-screen bg-[#e8f5d0] p-4 pb-24">
      {/* Balance Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-black text-gray-800">Balance</h1>
      </div>

      {/* Deposit Cash Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-xl shadow-md mb-2.5 overflow-hidden border-l-4 border-blue-400"
      >
        <div className="flex">
          {/* Left side - Illustration */}
          <div className="w-1/3 bg-gray-50 flex items-center justify-center p-3">
            <img 
              src="/deposit.png" 
              alt="Deposit" 
              className="w-full h-auto object-contain max-w-[80px]"
            />
          </div>

          {/* Right side - Content */}
          <div className="flex-1 p-3 flex flex-col justify-center">
            <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-lg px-3 py-1.5 mb-2 inline-block">
              <h2 className="text-sm font-black text-gray-800">Deposit Cash</h2>
            </div>
            
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-blue-500 text-lg">₹</span>
              <span className="text-2xl font-black text-green-500">{user?.depositCash || 0}</span>
            </div>

            <button
              onClick={() => navigate('/deposit')}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-sm px-4 py-2 rounded-lg hover:scale-105 transition-all shadow-md"
            >
              + Add Cash
            </button>
          </div>
        </div>
      </motion.div>

      {/* Winning Cash Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-md mb-2.5 overflow-hidden border-l-4 border-yellow-400"
      >
        <div className="flex">
          {/* Left side - Illustration */}
          <div className="w-1/3 bg-gray-50 flex items-center justify-center p-3">
            <img 
              src="/win-cash.png" 
              alt="Winning" 
              className="w-full h-auto object-contain max-w-[80px]"
            />
          </div>

          {/* Right side - Content */}
          <div className="flex-1 p-3 flex flex-col justify-center">
            <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-lg px-3 py-1.5 mb-2 inline-block">
              <h2 className="text-sm font-black text-gray-800">Winning Cash</h2>
            </div>
            
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-blue-500 text-lg">₹</span>
              <span className="text-2xl font-black text-red-500">{user?.winningCash?.toFixed(0) || 0}</span>
            </div>

            <button
              onClick={() => navigate('/withdrawal')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-sm px-4 py-2 rounded-lg hover:scale-105 transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <span className="text-base">💳</span>
              Withdraw
            </button>
          </div>
        </div>
      </motion.div>

      {/* Bonus Cash Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-md mb-2.5 overflow-hidden border-l-4 border-purple-400"
      >
        <div className="flex">
          {/* Left side - Illustration */}
          <div className="w-1/3 bg-gray-50 flex items-center justify-center p-3">
            <img 
              src="/indian-rupee-money-bag.png" 
              alt="Bonus" 
              className="w-full h-auto object-contain max-w-[80px]"
            />
          </div>

          {/* Right side - Content */}
          <div className="flex-1 p-3 flex flex-col justify-center">
            <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-lg px-3 py-1.5 mb-2 inline-block">
              <h2 className="text-sm font-black text-gray-800">Bonus Cash</h2>
            </div>
            
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-blue-500 text-lg">₹</span>
              <span className="text-2xl font-black text-purple-500">{user?.bonusCash?.toFixed(0) || 0}</span>
            </div>

            <p className="text-gray-600 text-xs font-semibold">
              💡 Use bonus cash to play games
            </p>
          </div>
        </div>
      </motion.div>

      {/* Transaction History Link */}
      <Link
        to="/transactions"
        className="block bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-3 text-white font-bold text-sm flex items-center justify-between hover:scale-105 transition-all shadow-md border border-purple-400 mt-3 mb-2"
      >
        <span className="flex items-center gap-2">
          <FaHistory className="text-base" />
          Transaction History
        </span>
        <span className="text-lg">→</span>
      </Link>

      {/* Payment History Link */}
      <Link
        to="/payment-history"
        className="block bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-3 text-white font-bold text-sm flex items-center justify-between hover:scale-105 transition-all shadow-md border border-orange-400"
      >
        <span className="flex items-center gap-2">
          <span className="text-lg">📜</span>
          Payment History
        </span>
        <span className="text-lg">→</span>
      </Link>
    </div>
  );
};

export default Wallet;
