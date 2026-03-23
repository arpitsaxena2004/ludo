import { motion } from 'framer-motion';
import { FaWhatsapp, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const Contact = () => {
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
            <a
              href="https://wa.me/918441952800"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-green-600 p-4 rounded-xl hover:bg-green-700 transition-all"
            >
              <FaWhatsapp className="text-3xl text-white" />
              <div>
                <p className="text-white font-bold">WhatsApp</p>
                <p className="text-white/80 text-sm">+91 8441952800</p>
              </div>
            </a>

            <a
              href="mailto:support@a2zludo.com"
              className="flex items-center gap-4 bg-blue-600 p-4 rounded-xl hover:bg-blue-700 transition-all"
            >
              <FaEnvelope className="text-3xl text-white" />
              <div>
                <p className="text-white font-bold">Email</p>
                <p className="text-white/80 text-sm">support@a2zludo.com</p>
              </div>
            </a>

            <a
              href="tel:918441952800"
              className="flex items-center gap-4 bg-purple-600 p-4 rounded-xl hover:bg-purple-700 transition-all"
            >
              <FaPhone className="text-3xl text-white" />
              <div>
                <p className="text-white font-bold">Phone</p>
                <p className="text-white/80 text-sm">+91 8441952800</p>
              </div>
            </a>

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
