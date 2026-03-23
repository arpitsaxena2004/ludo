import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const [noticeText, setNoticeText] = useState('⚡ 5% Commission • 3% Referral • 24/7 Withdrawal • WhatsApp Support 📞');

  useEffect(() => {
    fetchNoticeText();
  }, []);

  const fetchNoticeText = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/config/public/noticeBoard`);
      if (response.data.success && response.data.data.value) {
        setNoticeText(response.data.data.value);
      }
    } catch (error) {
      console.error('Failed to fetch notice text:', error);
    }
  };

  const handlePlayNow = () => {
    navigate('/game-lobby');
  };

  return (
    <div className="min-h-screen bg-[#e8f5d0] pb-24">
      {/* Banner Image */}
      <div className="mb-4">
        <img 
          src="/barimage1.jpg" 
          alt="Banner" 
          className="w-full h-auto object-cover"
        />
      </div>

      {/* Notice Board */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-4 mb-4 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-4 shadow-lg"
      >
        <p className="text-white text-sm font-semibold text-center leading-tight">
          {noticeText}
        </p>
      </motion.div>

      {/* Game Cards Grid */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Ludo Classic Card */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          onClick={handlePlayNow}
          className="relative bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl p-6 text-center shadow-lg cursor-pointer hover:scale-105 transition-all overflow-hidden"
        >
          <div className="absolute top-2 right-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <div className="mb-3">
            <img src="/logo.png" alt="Ludo" className="w-20 h-20 mx-auto object-contain" />
          </div>
          <h3 className="text-white font-black text-xl mb-1">LUDO</h3>
          <p className="text-white/90 font-bold text-sm">CLASSIC</p>
        </motion.div>

        {/* Support Card */}
        <motion.a
          href="https://wa.me/919024608772"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl p-6 text-center shadow-lg hover:scale-105 transition-all overflow-hidden"
        >
          <div className="absolute top-2 right-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <div className="mb-3">
            <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center">
              <FaWhatsapp className="text-5xl text-green-600" />
            </div>
          </div>
          <h3 className="text-white font-black text-xl mb-1">SUPPORT</h3>
          <p className="text-white/90 font-bold text-sm">24/7</p>
        </motion.a>
      </div>
    </div>
  );
};

export default Home;
