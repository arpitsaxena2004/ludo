import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCommissionRate } from '../utils/config';

const About = () => {
  const [commissionRate, setCommissionRate] = useState(5);

  useEffect(() => {
    const fetchCommission = async () => {
      const rate = await getCommissionRate();
      setCommissionRate(rate);
    };
    fetchCommission();
  }, []);

  return (
    <div className="min-h-screen bg-[#e8f5d0] p-4 pb-24">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-gray-700"
      >
        <h1 className="text-3xl font-black text-white mb-6">About A2Z Ludo</h1>
        
        <div className="space-y-4 text-gray-300">
          <section>
            <h2 className="text-xl font-bold text-white mb-2">Who We Are</h2>
            <p>A2Z Ludo is India's premier online Ludo gaming platform where you can turn fun into funds. We provide a secure, fair, and entertaining environment for Ludo enthusiasts.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">Our Mission</h2>
            <p>To provide the best online Ludo gaming experience with fair play, instant withdrawals, and 24/7 customer support.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">Why Choose Us</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>100% Safe and Secure Platform</li>
              <li>Instant Withdrawals (24/7)</li>
              <li>24/7 Customer Support</li>
              <li>Fair Play Guaranteed</li>
              <li>Low Commission ({commissionRate}%)</li>
              <li>Referral Bonus Program</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">Our Values</h2>
            <p>We believe in transparency, fairness, and providing the best gaming experience to our users. Your trust and satisfaction are our top priorities.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">Contact Information</h2>
            <p>For any queries or support, reach out to us via WhatsApp, Email, or Phone. We're always here to help!</p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default About;
