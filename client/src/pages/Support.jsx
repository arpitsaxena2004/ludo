import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaTelegramPlane } from 'react-icons/fa';
import axios from 'axios';

const Support = () => {
  const [telegramLink, setTelegramLink] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');

  useEffect(() => {
    fetchSupportLinks();
  }, []);

  const fetchSupportLinks = async () => {
    try {
      const [whatsappRes, telegramRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/config/public/whatsappGroup`),
        axios.get(`${import.meta.env.VITE_API_URL}/config/public/telegramGroup`)
      ]);

      if (whatsappRes.data.success && whatsappRes.data.data.value) {
        setWhatsappLink(whatsappRes.data.data.value);
      }
      if (telegramRes.data.success && telegramRes.data.data.value) {
        setTelegramLink(telegramRes.data.data.value);
      }
    } catch (error) {
      console.error('Failed to fetch support links:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8f5d0] p-3 pb-20">
      {/* Header Card with Illustration */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-xl p-3 mb-3 text-center shadow-md border-2 border-dashed border-gray-300"
      >
        <div className="mb-2">
          <img 
            src="/support.jpg" 
            alt="Customer Support" 
            className="w-24 h-20 mx-auto object-contain"
          />
        </div>
        <h1 className="text-2xl font-black text-red-500 mb-1">Need Help?</h1>
        <p className="text-gray-800 text-sm font-semibold">
          Join our communities for 24/7 support
        </p>
      </motion.div>

      {/* Contact Section */}
      <div className="mb-2">
        <h2 className="text-gray-800 font-bold text-sm mb-2">Official Communities</h2>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 gap-3">
        {/* Telegram Card */}
        <motion.a
          href={telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-3 shadow-md flex items-center gap-3 hover:scale-105 transition-all"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
            <FaTelegramPlane className="text-2xl text-white" />
          </div>
          <div className="text-left flex-1">
            <h3 className="text-gray-800 font-bold text-base">Telegram Group</h3>
            <p className="text-gray-500 text-xs font-semibold">Join for latest updates</p>
          </div>
        </motion.a>

        {/* WhatsApp Card */}
        <motion.a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-3 shadow-md flex items-center gap-3 hover:scale-105 transition-all"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
            <FaWhatsapp className="text-2xl text-white" />
          </div>
          <div className="text-left flex-1">
            <h3 className="text-gray-800 font-bold text-base">WhatsApp Group</h3>
            <p className="text-gray-500 text-xs font-semibold">Chat with support team</p>
          </div>
        </motion.a>
      </div>
    </div>
  );
};

export default Support;
