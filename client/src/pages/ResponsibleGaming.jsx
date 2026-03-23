import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { policyAPI } from '../services/api';

const ResponsibleGaming = () => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const response = await policyAPI.getPolicy('responsible-gaming');
      setPolicy(response.data.policy);
    } catch (error) {
      // Fallback to default content
      setPolicy({
        title: 'Responsible Gaming',
        sections: [
          { heading: 'Play Responsibly', content: 'Gaming should be fun and entertaining. We encourage all players to play responsibly and within their means.' },
          { heading: 'Set Limits', content: 'Set deposit and time limits for yourself. Never chase losses and know when to stop.' },
          { heading: 'Age Restriction', content: 'Our platform is strictly for users aged 18 and above. Underage gaming is prohibited.' },
          { heading: 'Self-Exclusion', content: 'If you feel you need a break, you can request temporary or permanent account suspension by contacting support.' },
          { heading: 'Warning Signs', content: '• Spending more money than you can afford\n• Gaming interfering with daily responsibilities\n• Borrowing money to play\n• Feeling anxious or irritable when not playing' },
          { heading: 'Get Help', content: 'If you or someone you know has a gaming problem, please seek help from professional organizations.' },
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
        <h1 className="text-3xl font-black text-white mb-6">{policy?.title || 'Responsible Gaming'}</h1>
        
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

export default ResponsibleGaming;
