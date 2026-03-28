import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaEnvelope, FaPhone, FaMapMarkerAlt, FaTelegramPlane } from 'react-icons/fa';
import axios from 'axios';

const Contact = () => {
  const [whatsappNumber, setWhatsappNumber] = useState('+918441952800');
  const [telegramLink, setTelegramLink] = useState('');
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const [whatsappNumRes, telegramRes, whatsappGroupRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/config/public/whatsappSupportNumber`).catch(() => ({ data: { data: { value: '' } } })),
        axios.get(`${import.meta.env.VITE_API_URL}/config/public/telegramGroup`).catch(() => ({ data: { data: { value: '' } } })),
        axios.get(`${import.meta.env.VITE_API_URL}/config/public/whatsappGroup`).catch(() => ({ data: { data: { value: '' } } }))
      ]);

      if (whatsappNumRes.data?.data?.value) {
        setWhatsappNumber(whatsappNumRes.data.data.value);
      }
      if (telegramRes.data?.data?.value) {
        setTelegramLink(telegramRes.data.data.value);
      }
      if (whatsappGroupRes.data?.data?.value) {
        setWhatsappGroupLink(whatsappGroupRes.data.data.value);
      }
    } catch (error) {
      console.error('Failed to fetch contact info:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8f5d0] p-4 pb-24">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-gray-700"
      >
        <h1 className="text-3xl font-black text-white mb-6">Contact Us</h1>
        
        <div className="space-y-4">
          <p className="text-gray-300">We're here to help! Reach out to us through any of the following channels:</p>

          <div className="space-y-3">
            {/* WhatsApp Direct */}
            <a
              href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-green-600 p-4 rounded-xl hover:bg-green-700 transition-all"
            >
              <FaWhatsapp className="text-3xl text-white" />
              <div>
                <p className="text-white font-bold">WhatsApp Support</p>
                <p className="text-white/80 text-sm">{whatsappNumber}</p>
              </div>
            </a>

            {/* WhatsApp Group */}
            {whatsappGroupLink && (
              <a
                href={whatsappGroupLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-green-500 p-4 rounded-xl hover:bg-green-600 transition-all"
              >
                <FaWhatsapp className="text-3xl text-white" />
                <div>
                  <p className="text-white font-bold">WhatsApp Group</p>
                  <p className="text-white/80 text-sm">Join our community</p>
                </div>
              </a>
            )}

            {/* Telegram Group */}
            {telegramLink && (
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-blue-500 p-4 rounded-xl hover:bg-blue-600 transition-all"
              >
                <FaTelegramPlane className="text-3xl text-white" />
                <div>
                  <p className="text-white font-bold">Telegram Group</p>
                  <p className="text-white/80 text-sm">Join for updates</p>
                </div>
              </a>
            )}

            {/* Email */}
            <a
              href="mailto:support@a2zludo.com"
              className="flex items-center gap-4 bg-purple-600 p-4 rounded-xl hover:bg-purple-700 transition-all"
            >
              <FaEnvelope className="text-3xl text-white" />
              <div>
                <p className="text-white font-bold">Email</p>
                <p className="text-white/80 text-sm">support@a2zludo.com</p>
              </div>
            </a>

            {/* Phone */}
            <a
              href={`tel:${whatsappNumber.replace(/[^0-9]/g, '')}`}
              className="flex items-center gap-4 bg-indigo-600 p-4 rounded-xl hover:bg-indigo-700 transition-all"
            >
              <FaPhone className="text-3xl text-white" />
              <div>
                <p className="text-white font-bold">Phone</p>
                <p className="text-white/80 text-sm">{whatsappNumber}</p>
              </div>
            </a>

            {/* Address */}
            <div className="flex items-center gap-4 bg-gray-700 p-4 rounded-xl">
              <FaMapMarkerAlt className="text-3xl text-white" />
              <div>
                <p className="text-white font-bold">Address</p>
                <p className="text-white/80 text-sm">India</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500 rounded-xl">
            <p className="text-yellow-400 font-bold mb-2">⏰ Support Hours</p>
            <p className="text-white">24/7 - We're always here to help you!</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Contact;
