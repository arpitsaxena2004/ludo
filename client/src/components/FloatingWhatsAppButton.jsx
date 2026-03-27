import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const FloatingWhatsAppButton = () => {
  const location = useLocation();
  const [whatsappNumber, setWhatsappNumber] = useState('919024608772');

  useEffect(() => {
    const fetchSupportNumber = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/config/public/whatsappSupportNumber`);
        if (response.data?.success && response.data?.data?.value) {
          // Strip non-digits to ensure proper wa.me formatting regardless of user input style
          const formattedNumber = response.data.data.value.replace(/\D/g, '');
          if (formattedNumber) {
            setWhatsappNumber(formattedNumber);
          }
        }
      } catch (error) {
        console.error('Failed to fetch whatsapp support number:', error);
      }
    };
    fetchSupportNumber();
  }, []);
  
  // Hide on BattleRoom page (when user clicks Ludo Classic and enters game)
  const shouldHide = location.pathname.startsWith('/battle-room');

  if (shouldHide) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 w-full max-w-md mx-auto flex justify-end pr-4 pointer-events-none">
      <motion.a
        href={`https://wa.me/${whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="pointer-events-auto bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full shadow-2xl hover:shadow-green-500/50 transition-all"
      >
        <div className="relative p-3">
          <FaWhatsapp className="text-2xl" />
          
          {/* Pulse animation ring */}
          <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>
          
          {/* 24/7 Badge */}
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
            24/7
          </div>
        </div>
      </motion.a>
    </div>
  );
};

export default FloatingWhatsAppButton;
