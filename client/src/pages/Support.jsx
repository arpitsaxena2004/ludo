import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaTelegramPlane } from 'react-icons/fa';
import axios from 'axios';

const Support = () => {
  const [telegramLink, setTelegramLink] = useState('https://t.me/a2zludo');
  const [whatsappLink, setWhatsappLink] = useState('https://wa.me/919024608772');

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
    <div className="min-h-screen bg-[#e8f5d0] p-4 pb-24">
      {/* Header Card with Illustration */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-2xl p-5 mb-4 text-center shadow-md border-2 border-dashed border-gray-300"
      >
        <div className="mb-3">
          <img 
            src="/support.jpg" 
            alt="Customer Support" 
            className="w-40 h-28 mx-auto object-contain"
          />
        </div>
        <h1 className="text-3xl font-black text-red-500 mb-1.5">Need Help?</h1>
        <p className="text-gray-800 text-base font-semibold">
          Join our communities for 24/7 support
        </p>
      </motion.div>

      {/* Contact Section */}
      <div className="mb-3">
        <h2 className="text-gray-800 font-bold text-base mb-3">Official Communities</h2>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 gap-4 mb-4">
        {/* Telegram Card */}
        <motion.a
          href={telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-md flex items-center gap-4 hover:scale-105 transition-all"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <FaTelegramPlane className="text-4xl text-white" />
          </div>
          <div className="text-left flex-1">
            <h3 className="text-gray-800 font-bold text-lg mb-1">Telegram Group</h3>
            <p className="text-gray-500 text-sm font-semibold">Join for latest updates</p>
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
          className="bg-white rounded-2xl p-4 shadow-md flex items-center gap-4 hover:scale-105 transition-all"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <FaWhatsapp className="text-4xl text-white" />
          </div>
          <div className="text-left flex-1">
            <h3 className="text-gray-800 font-bold text-lg mb-1">WhatsApp Group</h3>
            <p className="text-gray-500 text-sm font-semibold">Chat with support team</p>
          </div>
        </motion.a>
      </div>
    </div>
  );
};

export default Support;
