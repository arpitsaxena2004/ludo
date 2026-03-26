import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEdit, FaSignOutAlt, FaPhone, FaCheckCircle, FaSave, FaTimes, FaQrcode, FaBuilding } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

const Profile = () => {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [editedUpiId, setEditedUpiId] = useState(user?.upiId || '');

  const [isEditingBank, setIsEditingBank] = useState(false);
  const [editedBankDetails, setEditedBankDetails] = useState({
    accountHolderName: user?.bankDetails?.accountHolderName || '',
    accountNumber: user?.bankDetails?.accountNumber || '',
    ifscCode: user?.bankDetails?.ifscCode || '',
    bankName: user?.bankDetails?.bankName || ''
  });

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleUpdatePaymentDetails = async (type) => {
    setLoading(true);
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;
      
      const payload = type === 'upi' ? { upiId: editedUpiId } : { bankDetails: editedBankDetails };
      
      const response = await axios.put(
        '/user/profile',
        payload,
        {
          baseURL: import.meta.env.VITE_API_URL,
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      updateUser(payload);
      toast.success(`${type === 'upi' ? 'UPI ID' : 'Bank Details'} updated successfully!`);
      if (type === 'upi') setIsEditingUpi(false);
      else setIsEditingBank(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update details');
    } finally {
      setLoading(false);
    }
  };





  return (
    <div className="min-h-screen bg-[#e8f5d0] p-4 pb-24">
      {/* Profile Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-4 mb-4 text-center shadow-md"
      >
        <div className="relative inline-block mb-2">
          <img
            src={user?.avatar && user.avatar.startsWith('/') ? user.avatar : '/avatar1.png'}
            alt="Avatar"
            className="w-20 h-20 rounded-full border-4 border-white shadow-xl object-cover mx-auto"
          />
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-red-500 text-xl">💎</span>
          <h2 className="text-xl font-black text-white">
            {user?.username || 'User'}
          </h2>
        </div>

        {/* Display Mobile Number under Username */}
        <div className="flex items-center justify-center gap-2 mt-1 bg-white/10 rounded-full py-1.5 px-4 w-fit mx-auto border border-white/20 backdrop-blur-sm">
          <FaPhone className="text-white/80 text-xs" />
          <span className="text-white/90 text-sm font-semibold tracking-wide">
            +91 {user?.phoneNumber}
          </span>
        </div>
      </motion.div>

      {/* Complete Profile Section */}
      <div className="mb-4">
        <h3 className="text-gray-800 font-bold text-base mb-3">Complete Profile</h3>
        
        {/* UPI Details */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-3 mb-2 shadow-md flex items-center gap-3"
        >
          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <FaQrcode className="text-white text-xl" />
          </div>
          <div className="flex-1">
            <p className="text-gray-600 text-xs font-semibold">UPI ID</p>
            {isEditingUpi ? (
              <input
                type="text"
                value={editedUpiId}
                onChange={(e) => setEditedUpiId(e.target.value)}
                placeholder="Enter UPI ID (e.g. name@upi)"
                className="bg-gray-100 border-2 border-purple-300 rounded-lg px-2 py-1 text-gray-800 font-bold text-sm outline-none focus:border-purple-500 w-full"
                autoFocus
              />
            ) : (
              <p className="text-gray-800 font-bold text-sm truncate">{user?.upiId || 'Not set'}</p>
            )}
          </div>
          {isEditingUpi ? (
            <div className="flex gap-2">
              <button onClick={() => handleUpdatePaymentDetails('upi')} disabled={loading} className="text-green-500 text-xl hover:scale-110 transition-all"><FaSave /></button>
              <button onClick={() => { setIsEditingUpi(false); setEditedUpiId(user?.upiId || ''); }} className="text-red-500 text-xl hover:scale-110 transition-all"><FaTimes /></button>
            </div>
          ) : (
            <button onClick={() => setIsEditingUpi(true)} className="text-purple-500 text-xl hover:scale-110 transition-all"><FaEdit /></button>
          )}
        </motion.div>

        {/* Bank Details */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl p-3 mb-2 shadow-md"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaBuilding className="text-white text-xl" />
            </div>
            <div className="flex-1 flex justify-between items-center">
              <p className="text-gray-600 text-xs font-semibold">Bank Details</p>
              {isEditingBank ? (
                <div className="flex gap-2">
                  <button onClick={() => handleUpdatePaymentDetails('bank')} disabled={loading} className="text-green-500 text-xl hover:scale-110 transition-all"><FaSave /></button>
                  <button onClick={() => { setIsEditingBank(false); setEditedBankDetails({ accountHolderName: user?.bankDetails?.accountHolderName || '', accountNumber: user?.bankDetails?.accountNumber || '', ifscCode: user?.bankDetails?.ifscCode || '', bankName: user?.bankDetails?.bankName || '' }); }} className="text-red-500 text-xl hover:scale-110 transition-all"><FaTimes /></button>
                </div>
              ) : (
                <button onClick={() => setIsEditingBank(true)} className="text-purple-500 text-xl hover:scale-110 transition-all"><FaEdit /></button>
              )}
            </div>
          </div>
          <div className="pl-14">
            {isEditingBank ? (
              <div className="flex flex-col gap-2">
                <input type="text" value={editedBankDetails.accountHolderName} onChange={(e) => setEditedBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))} placeholder="Account Holder Name" className="bg-gray-100 border-2 border-green-300 rounded-lg px-2 py-1 text-gray-800 font-bold text-sm outline-none focus:border-green-500 w-full" />
                <input type="text" value={editedBankDetails.accountNumber} onChange={(e) => setEditedBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))} placeholder="Account Number" className="bg-gray-100 border-2 border-green-300 rounded-lg px-2 py-1 text-gray-800 font-bold text-sm outline-none focus:border-green-500 w-full" />
                <input type="text" value={editedBankDetails.ifscCode} onChange={(e) => setEditedBankDetails(prev => ({ ...prev, ifscCode: e.target.value }))} placeholder="IFSC Code" className="bg-gray-100 border-2 border-green-300 rounded-lg px-2 py-1 text-gray-800 font-bold text-sm outline-none focus:border-green-500 w-full uppercase" />
                <input type="text" value={editedBankDetails.bankName} onChange={(e) => setEditedBankDetails(prev => ({ ...prev, bankName: e.target.value }))} placeholder="Bank Name" className="bg-gray-100 border-2 border-green-300 rounded-lg px-2 py-1 text-gray-800 font-bold text-sm outline-none focus:border-green-500 w-full" />
              </div>
            ) : (
              <div className="flex flex-col gap-1 text-gray-800 font-bold text-sm">
                <p>{user?.bankDetails?.accountHolderName || 'Name not set'}</p>
                <p className="text-gray-500">{user?.bankDetails?.accountNumber ? `A/C: ${user?.bankDetails?.accountNumber}` : 'Account not set'}</p>
                <p className="text-gray-500 text-xs">{user?.bankDetails?.ifscCode || ''} {user?.bankDetails?.bankName ? `| ${user?.bankDetails?.bankName}` : ''}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* KYC Verification 
      <Link to="/kyc">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 mb-4 text-center shadow-md hover:scale-105 transition-transform"
        >
          <div className="text-4xl mb-2">🆔</div>
          <h3 className="text-white font-black text-lg">KYC VERIFICATION</h3>
        </motion.div>
      </Link> */}



      {/* Other Details */}
      <div className="mb-4">
        <h3 className="text-gray-800 font-bold text-base mb-3">Other Details</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Referral Earning */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-4 text-center shadow-md"
          >
            <div className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-xl">🎁</span>
            </div>
            <h4 className="text-white font-bold text-xs mb-1.5">Referral Earning</h4>
            <p className="text-white font-black text-2xl">{user?.referralEarnings || 0}</p>
          </motion.div>

          {/* Battle Played */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-cyan-400 to-green-400 rounded-2xl p-4 text-center shadow-md"
          >
            <div className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-xl">⚔️</span>
            </div>
            <h4 className="text-white font-bold text-xs mb-1.5">Battle Played</h4>
            <p className="text-white font-black text-2xl">{user?.totalGamesPlayed || 0}</p>
          </motion.div>

          {/* Coin Won */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-center shadow-md"
          >
            <div className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-xl">🪙</span>
            </div>
            <h4 className="text-white font-bold text-xs mb-1.5">Coin Won</h4>
            <p className="text-white font-black text-2xl">{user?.totalCoinsWon || 0}</p>
          </motion.div>

          {/* Total Withdrawal */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl p-4 text-center shadow-md"
          >
            <div className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-xl">💰</span>
            </div>
            <h4 className="text-white font-bold text-xs mb-1.5">Total Withdrawal</h4>
            <p className="text-white font-black text-2xl">{user?.totalWithdrawal || 0}</p>
          </motion.div>
        </div>
      </div>

      {/* Logout Button */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={handleLogout}
        className="w-full bg-black text-white font-bold text-base py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-md"
      >
        Log Out
      </motion.button>
    </div>
  );
};

export default Profile;
