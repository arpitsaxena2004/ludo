import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHistory } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const Wallet = () => {
  const { user, updateUser, fetchBalance } = useAuthStore();
  const navigate = useNavigate();

  // Fetch balance on mount and set up real-time updates
  useEffect(() => {
    fetchBalance(); // Initial fetch
    
    const interval = setInterval(() => {
      fetchBalance();
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [fetchBalance]);

  return (
    <div className="min-h-screen bg-[#e8f5d0] p-3 pb-24">
      {/* Balance Header */}
      <div className="mb-3">
        <h1 className="text-xl font-black text-gray-800">Balance</h1>
      </div>

      {/* Deposit Cash Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-lg shadow-md mb-2 overflow-hidden border-l-4 border-blue-400"
      >
        <div className="flex">
          {/* Left side - Illustration */}
          <div className="w-1/4 bg-gray-50 flex items-center justify-center p-2">
            <img 
              src="/deposit.png" 
              alt="Deposit" 
              className="w-full h-auto object-contain max-w-[60px]"
            />
          </div>

          {/* Right side - Content */}
          <div className="flex-1 p-2.5 flex flex-col justify-center">
            <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-md px-2 py-1 mb-1.5 inline-block">
              <h2 className="text-xs font-black text-gray-800">Deposit Cash</h2>
            </div>
            
            <div className="flex items-center gap-1 mb-1.5">
              <span className="text-blue-500 text-base">₹</span>
              <span className="text-xl font-black text-green-500">{(user?.depositCash || 0).toFixed(2)}</span>
            </div>

            <button
              onClick={() => navigate('/deposit')}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-xs px-3 py-1.5 rounded-md hover:scale-105 transition-all shadow-md"
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
        className="bg-white rounded-lg shadow-md mb-2 overflow-hidden border-l-4 border-yellow-400"
      >
        <div className="flex">
          {/* Left side - Illustration */}
          <div className="w-1/4 bg-gray-50 flex items-center justify-center p-2">
            <img 
              src="/win-cash.png" 
              alt="Winning" 
              className="w-full h-auto object-contain max-w-[60px]"
            />
          </div>

          {/* Right side - Content */}
          <div className="flex-1 p-2.5 flex flex-col justify-center">
            <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-md px-2 py-1 mb-1.5 inline-block">
              <h2 className="text-xs font-black text-gray-800">Winning Cash</h2>
            </div>
            
            <div className="flex items-center gap-1 mb-1.5">
              <span className="text-blue-500 text-base">₹</span>
              <span className="text-xl font-black text-red-500">{(user?.winningCash || 0).toFixed(2)}</span>
            </div>

            <button
              onClick={() => navigate('/withdrawal')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-xs px-3 py-1.5 rounded-md hover:scale-105 transition-all shadow-md flex items-center justify-center gap-1"
            >
              <span className="text-sm">💳</span>
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
        className="bg-white rounded-lg shadow-md mb-2 overflow-hidden border-l-4 border-purple-400"
      >
        <div className="flex">
          {/* Left side - Illustration */}
          <div className="w-1/4 bg-gray-50 flex items-center justify-center p-2">
            <img 
              src="/indian-rupee-money-bag.png" 
              alt="Bonus" 
              className="w-full h-auto object-contain max-w-[60px]"
            />
          </div>

          {/* Right side - Content */}
          <div className="flex-1 p-2.5 flex flex-col justify-center">
            <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-md px-2 py-1 mb-1.5 inline-block">
              <h2 className="text-xs font-black text-gray-800">Bonus Cash</h2>
            </div>
            
            <div className="flex items-center gap-1 mb-1.5">
              <span className="text-blue-500 text-base">₹</span>
              <span className="text-xl font-black text-purple-500">{(user?.bonusCash || 0).toFixed(2)}</span>
            </div>

            <p className="text-gray-600 text-[10px] font-semibold">
              💡 Use bonus cash to play games
            </p>
          </div>
        </div>
      </motion.div>

      {/* Transaction History Link */}
      <Link
        to="/transactions"
        className="block bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-2.5 text-white font-bold text-xs flex items-center justify-between hover:scale-105 transition-all shadow-md border border-purple-400 mt-2.5 mb-1.5"
      >
        <span className="flex items-center gap-1.5">
          <FaHistory className="text-sm" />
          Transaction History
        </span>
        <span className="text-base">→</span>
      </Link>

      {/* Payment History Link */}
      <Link
        to="/payment-history"
        className="block bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-2.5 text-white font-bold text-xs flex items-center justify-between hover:scale-105 transition-all shadow-md border border-orange-400"
      >
        <span className="flex items-center gap-1.5">
          <span className="text-base">📜</span>
          Payment History
        </span>
        <span className="text-base">→</span>
      </Link>
    </div>
  );
};

export default Wallet;
