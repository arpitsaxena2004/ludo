import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { policyAPI } from '../services/api';

const TermsConditions = () => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const response = await policyAPI.getPolicy('terms-conditions');
      setPolicy(response.data.policy);
    } catch (error) {
      // Fallback to default content
      setPolicy({
        title: 'Terms & Conditions',
        sections: [
          { heading: '1. Acceptance of Terms', content: 'By accessing and using A2Z Ludo, you accept and agree to be bound by the terms and provision of this agreement.' },
          { heading: '2. Eligibility', content: 'You must be at least 18 years old to use this service. By using A2Z Ludo, you represent that you meet this age requirement.' },
          { heading: '3. User Account', content: 'You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.' },
          { heading: '4. Fair Play', content: 'Users must play fairly and not use any cheating methods, bots, or unfair advantages. Violation may result in account suspension or termination.' },
          { heading: '5. Payments and Withdrawals', content: 'All transactions are subject to verification. Withdrawals require KYC completion and may take 24-48 hours to process.' },
          { heading: '6. Termination', content: 'We reserve the right to terminate or suspend your account at any time for violations of these terms.' },
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
        <h1 className="text-3xl font-black text-white mb-6">{policy?.title || 'Terms & Conditions'}</h1>
        
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

export default TermsConditions;
