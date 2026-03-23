import { motion } from 'framer-motion';
import { FaWhatsapp, FaEnvelope, FaPhone } from 'react-icons/fa';

const Support = () => {
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
          We're here to help you 24/7
        </p>
      </motion.div>

      {/* Contact Section */}
      <div className="mb-3">
        <h2 className="text-gray-800 font-bold text-base mb-3">Contact Us At Below Platforms.</h2>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* WhatsApp Card */}
        <motion.a
          href="https://wa.me/919024608772"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-md text-center hover:scale-105 transition-all"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <FaWhatsapp className="text-3xl text-white" />
          </div>
          <h3 className="text-gray-800 font-bold text-base mb-1.5">WhatsApp</h3>
          <p className="text-gray-500 text-xs">Chat with us directly</p>
        </motion.a>

        {/* Email Card */}
        <motion.a
          href="mailto:support@a2zludo.com"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-md text-center hover:scale-105 transition-all"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <FaEnvelope className="text-3xl text-white" />
          </div>
          <h3 className="text-gray-800 font-bold text-base mb-1.5">Email Support</h3>
          <p className="text-gray-500 text-xs">Follow us for updates</p>
        </motion.a>
      </div>

      {/* Phone Support Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-4 shadow-md"
      >
        <h3 className="text-gray-800 font-bold text-base mb-3">Get instant help from our team</h3>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <FaPhone className="text-2xl text-white" />
          </div>
          <div>
            <h4 className="text-gray-800 font-bold text-base mb-1">Phone Support</h4>
            <a 
              href="tel:9024608772"
              className="text-blue-500 text-xl font-black hover:underline"
            >
              9024608772
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Support;
