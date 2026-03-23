import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { policyAPI } from '../services/api';

const PrivacyPolicy = () => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const response = await policyAPI.getPolicy('privacy-policy');
      setPolicy(response.data.policy);
    } catch (error) {
      // Fallback to default content
      setPolicy({
        title: 'Privacy Policy',
        sections: [
          { heading: '1. Information We Collect', content: 'We collect information that you provide directly to us, including your phone number, username, email address, and gameplay data.' },
          { heading: '2. How We Use Your Information', content: 'We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.' },
          { heading: '3. Information Sharing', content: 'We do not sell or share your personal information with third parties except as described in this policy or with your consent.' },
          { heading: '4. Data Security', content: 'We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or destruction.' },
          { heading: '5. Your Rights', content: 'You have the right to access, update, or delete your personal information at any time through your account settings.' },
          { heading: '6. Contact Us', content: 'If you have any questions about this Privacy Policy, please contact us through our support channels.' },
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e8f5d0] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8f5d0] p-4 pb-24">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-gray-700"
      >
        <h1 className="text-3xl font-black text-white mb-6">{policy?.title || 'Privacy Policy'}</h1>
        
        <div className="space-y-4 text-gray-300">
          {policy?.sections?.map((section, index) => (
            <section key={index}>
              {section.heading && (
                <h2 className="text-xl font-bold text-white mb-2">{section.heading}</h2>
              )}
              <p className="whitespace-pre-wrap">{section.content}</p>
            </section>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
