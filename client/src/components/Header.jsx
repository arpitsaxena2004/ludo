import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaWallet, FaGift, FaChevronRight, FaUser, FaGamepad, FaHistory, FaHeadset, FaFileAlt, FaArrowLeft, FaLanguage } from 'react-icons/fa';
import useAuthStore from '../store/authStore';

const Header = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);

  const handleMenuItemClick = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-gradient-to-b from-black via-gray-900 to-gray-900/95 backdrop-blur-xl z-50 w-full max-w-[480px] mx-auto shadow-2xl border-b-2 border-purple-500/30">
        <div className="flex items-center justify-between px-3 sm:px-4 py-4 sm:py-5">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white text-xl sm:text-2xl hover:scale-110 transition-transform bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-sm"
          >
            <FaBars />
          </button>

          <Link to="/" className="flex items-center gap-2 flex-1 justify-center">
            <img src="/logo.png" alt="A2Z LUDO" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
            <div className="flex flex-col">
              <span className="text-white font-black text-base sm:text-lg leading-none">A2Z LUDO</span>
              <span className="text-yellow-400 font-bold text-[10px] sm:text-xs leading-none">Turn Fun Into Funds</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link 
              to="/wallet"
              className="bg-gradient-to-r from-yellow-400 to-orange-500 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl flex items-center gap-1.5 hover:scale-105 transition-transform shadow-lg"
            >
              <FaWallet className="text-white text-sm sm:text-base" />
              <span className="text-white font-black text-xs sm:text-sm">
                {user?.depositCash || 0}
              </span>
            </Link>
            
            <Link 
              to="/wallet"
              className="bg-gradient-to-r from-pink-500 to-purple-500 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl flex items-center gap-1.5 hover:scale-105 transition-transform shadow-lg"
            >
              <FaGift className="text-white text-sm sm:text-base" />
              <span className="text-white font-black text-xs sm:text-sm">
                {user?.winningCash?.toFixed(0) || '0'}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Side Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-[#e8f5d0] z-[110] shadow-2xl"
              style={{ maxWidth: '85vw' }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                  <h2 className="text-white font-black text-xl">A2Z Ludo</h2>
                </div>
                <button 
                  onClick={() => setMenuOpen(false)}
                  className="text-black bg-yellow-400 w-10 h-10 rounded-lg flex items-center justify-center hover:scale-110 transition-transform font-bold text-xl"
                >
                  ✕
                </button>
              </div>

              {/* Menu Items */}
              <div className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
                {/* My Profile */}
                <button
                  onClick={() => handleMenuItemClick('/profile')}
                  className="w-full bg-blue-100 hover:bg-blue-200 rounded-2xl p-4 flex items-center justify-between transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <FaUser className="text-blue-600 text-2xl" />
                    <span className="text-gray-800 font-bold text-lg">My Profile</span>
                  </div>
                  <FaChevronRight className="text-gray-600" />
                </button>

                {/* Play */}
                <button
                  onClick={() => handleMenuItemClick('/game-lobby')}
                  className="w-full bg-blue-100 hover:bg-blue-200 rounded-2xl p-4 flex items-center justify-between transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <FaGamepad className="text-blue-600 text-2xl" />
                    <span className="text-gray-800 font-bold text-lg">Play</span>
                  </div>
                  <FaChevronRight className="text-gray-600" />
                </button>

                {/* My Wallet */}
                <button
                  onClick={() => handleMenuItemClick('/wallet')}
                  className="w-full bg-blue-100 hover:bg-blue-200 rounded-2xl p-4 flex items-center justify-between transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <FaWallet className="text-blue-600 text-2xl" />
                    <span className="text-gray-800 font-bold text-lg">My Wallet</span>
                  </div>
                  <FaChevronRight className="text-gray-600" />
                </button>

                {/* Refer and Earn */}
                <button
                  onClick={() => handleMenuItemClick('/refer')}
                  className="w-full bg-blue-100 hover:bg-blue-200 rounded-2xl p-4 flex items-center justify-between transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <FaGift className="text-blue-600 text-2xl" />
                    <span className="text-gray-800 font-bold text-lg">Refer and Earn</span>
                  </div>
                  <FaChevronRight className="text-gray-600" />
                </button>

                {/* History */}
                <button
                  onClick={() => handleMenuItemClick('/transactions')}
                  className="w-full bg-blue-100 hover:bg-blue-200 rounded-2xl p-4 flex items-center justify-between transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <FaHistory className="text-blue-600 text-2xl" />
                    <span className="text-gray-800 font-bold text-lg">History</span>
                  </div>
                  <FaChevronRight className="text-gray-600" />
                </button>

                {/* Support */}
                <button
                  onClick={() => handleMenuItemClick('/support')}
                  className="w-full bg-blue-100 hover:bg-blue-200 rounded-2xl p-4 flex items-center justify-between transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <FaHeadset className="text-blue-600 text-2xl" />
                    <span className="text-gray-800 font-bold text-lg">Support</span>
                  </div>
                  <FaChevronRight className="text-gray-600" />
                </button>

                

                {/* All Policy */}
                <button
                  onClick={() => setPolicyOpen(!policyOpen)}
                  className="w-full bg-blue-100 hover:bg-blue-200 rounded-2xl p-4 flex items-center justify-between transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <FaFileAlt className="text-blue-600 text-2xl" />
                    <span className="text-gray-800 font-bold text-lg">All Policy</span>
                  </div>
                  <FaChevronRight className="text-gray-600" />
                </button>

                {/* Policy Submenu */}
                <AnimatePresence>
                  {policyOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pl-4 space-y-2"
                    >
                      <button
                        onClick={() => handleMenuItemClick('/privacy-policy')}
                        className="w-full bg-white hover:bg-gray-100 rounded-xl p-3 text-left text-gray-700 font-semibold transition-all"
                      >
                        • Privacy Policy
                      </button>
                      <button
                        onClick={() => handleMenuItemClick('/terms-conditions')}
                        className="w-full bg-white hover:bg-gray-100 rounded-xl p-3 text-left text-gray-700 font-semibold transition-all"
                      >
                        • Terms & Conditions
                      </button>
                      <button
                        onClick={() => handleMenuItemClick('/tds-policy')}
                        className="w-full bg-white hover:bg-gray-100 rounded-xl p-3 text-left text-gray-700 font-semibold transition-all"
                      >
                        • TDS Policy
                      </button>
                      <button
                        onClick={() => handleMenuItemClick('/responsible-gaming')}
                        className="w-full bg-white hover:bg-gray-100 rounded-xl p-3 text-left text-gray-700 font-semibold transition-all"
                      >
                        • Responsible Gaming
                      </button>
                      <button
                        onClick={() => handleMenuItemClick('/about')}
                        className="w-full bg-white hover:bg-gray-100 rounded-xl p-3 text-left text-gray-700 font-semibold transition-all"
                      >
                        • About
                      </button>
                      <button
                        onClick={() => handleMenuItemClick('/contact')}
                        className="w-full bg-white hover:bg-gray-100 rounded-xl p-3 text-left text-gray-700 font-semibold transition-all"
                      >
                        • Contact
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Back */}
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full bg-blue-100 hover:bg-blue-200 rounded-2xl p-4 flex items-center justify-between transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <FaArrowLeft className="text-blue-600 text-2xl" />
                    <span className="text-gray-800 font-bold text-lg">Back</span>
                  </div>
                  <FaChevronRight className="text-gray-600" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
