import { useState, useEffect } from 'react';
import { FaSave, FaFileAlt, FaPlus, FaMinus, FaEdit, FaUndo } from 'react-icons/fa';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

const POLICY_TYPES = [
  { key: 'privacy-policy', label: 'Privacy Policy' },
  { key: 'terms-conditions', label: 'Terms & Conditions' },
  { key: 'responsible-gaming', label: 'Responsible Gaming' },
  { key: 'tds-policy', label: 'TDS Policy' },
  { key: 'refund-policy', label: 'Refund Policy' },
  { key: 'about-us', label: 'About Us' },
];

const DEFAULT_POLICIES = {
  'privacy-policy': {
    title: 'Privacy Policy',
    sections: [
      { heading: '1. Information We Collect', content: 'We collect information that you provide directly to us, including your phone number, username, email address, and gameplay data. This includes:\n\n• Personal identification information (phone number, email)\n• Profile information (username, avatar)\n• Financial information (transaction history, wallet balance)\n• Device information (device type, OS version, IP address)\n• Gameplay data (game history, statistics)' },
      { heading: '2. How We Use Your Information', content: 'We use the information we collect to:\n\n• Provide, maintain, and improve our services\n• Process transactions and send related information\n• Send promotional communications (with your consent)\n• Monitor and analyze trends, usage, and activities\n• Detect, investigate, and prevent fraudulent transactions\n• Personalize and improve your gaming experience' },
      { heading: '3. Information Sharing', content: 'We do not sell or share your personal information with third parties except:\n\n• With your consent\n• To comply with legal obligations\n• To protect our rights and prevent fraud\n• With service providers who assist our operations\n• In connection with a merger or acquisition' },
      { heading: '4. Data Security', content: 'We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. These measures include:\n\n• Encryption of sensitive data\n• Secure server infrastructure\n• Regular security audits\n• Access controls and authentication\n• Employee training on data protection' },
      { heading: '5. Your Rights', content: 'You have the right to:\n\n• Access your personal information\n• Update or correct your data\n• Delete your account and associated data\n• Opt-out of promotional communications\n• Request a copy of your data\n• Lodge a complaint with regulatory authorities' },
      { heading: '6. Cookies and Tracking', content: 'We use cookies and similar tracking technologies to:\n\n• Remember your preferences\n• Analyze app usage patterns\n• Improve our services\n• Provide personalized content\n\nYou can control cookie settings through your device settings.' },
      { heading: '7. Children\'s Privacy', content: 'Our services are not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we discover that a child has provided us with personal information, we will delete it immediately.' },
      { heading: '8. Changes to This Policy', content: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of the service after changes constitutes acceptance of the updated policy.' },
      { heading: '9. Contact Us', content: 'If you have any questions about this Privacy Policy, please contact us:\n\n• Email: support@a2zludo.com\n• In-app Support: Settings > Help & Support\n• Response time: Within 24-48 hours' },
    ]
  },
  'terms-conditions': {
    title: 'Terms & Conditions',
    sections: [
      { heading: '1. Acceptance of Terms', content: 'By accessing and using A2Z Ludo, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our services.\n\nThese terms constitute a legally binding agreement between you and A2Z Ludo.' },
      { heading: '2. Eligibility', content: 'To use A2Z Ludo, you must:\n\n• Be at least 18 years of age\n• Be a resident of a state where skill-based gaming is legal\n• Have the legal capacity to enter into a binding agreement\n• Not be prohibited from using our services under applicable laws\n\nBy using our services, you represent and warrant that you meet all eligibility requirements.' },
      { heading: '3. User Account', content: 'Account Responsibilities:\n\n• You are responsible for maintaining the confidentiality of your account credentials\n• You must provide accurate and complete information during registration\n• You are responsible for all activities that occur under your account\n• You must notify us immediately of any unauthorized access\n• One account per user - multiple accounts are prohibited\n• Account sharing is strictly prohibited' },
      { heading: '4. Fair Play Policy', content: 'Users must play fairly and honestly. The following are strictly prohibited:\n\n• Using bots, scripts, or automated tools\n• Exploiting bugs or glitches\n• Colluding with other players\n• Using multiple accounts\n• Any form of cheating or manipulation\n• Abusive behavior towards other players\n\nViolation of fair play rules will result in immediate account suspension or permanent ban without refund.' },
      { heading: '5. Payments and Deposits', content: 'Deposit Terms:\n\n• Minimum deposit: ₹50\n• Maximum deposit: ₹10,000 per transaction\n• Deposits are processed instantly via approved payment methods\n• All deposits are non-refundable except as required by law\n• You must use payment methods registered in your own name\n• We reserve the right to verify your identity before processing deposits' },
      { heading: '6. Withdrawals', content: 'Withdrawal Terms:\n\n• Minimum withdrawal: ₹100\n• Maximum withdrawal: ₹50,000 per transaction\n• KYC verification is mandatory for withdrawals\n• Processing time: 24-48 hours\n• Withdrawals are made to verified bank accounts only\n• TDS will be deducted as per applicable laws\n• We reserve the right to verify the source of funds' },
      { heading: '7. Game Rules', content: 'General Game Rules:\n\n• All games are skill-based\n• Entry fees are deducted from your wallet before game starts\n• Winnings are credited after game completion\n• In case of disconnection, standard reconnection rules apply\n• Disputes must be raised within 24 hours of game completion\n• Our decision on disputes is final and binding' },
      { heading: '8. Prohibited Activities', content: 'The following activities are strictly prohibited:\n\n• Money laundering or fraudulent activities\n• Using the platform for illegal purposes\n• Harassment or abuse of other users\n• Attempting to hack or disrupt our services\n• Creating fake accounts or identities\n• Promoting competing services\n• Any activity that violates applicable laws' },
      { heading: '9. Intellectual Property', content: 'All content on A2Z Ludo, including but not limited to:\n\n• Logos, trademarks, and brand elements\n• Game designs and graphics\n• Software and source code\n• Text, images, and multimedia content\n\nAre the exclusive property of A2Z Ludo and protected by intellectual property laws. Unauthorized use is prohibited.' },
      { heading: '10. Limitation of Liability', content: 'A2Z Ludo shall not be liable for:\n\n• Any indirect, incidental, or consequential damages\n• Loss of profits or data\n• Service interruptions or technical issues\n• Actions of third parties\n• Force majeure events\n\nOur total liability shall not exceed the amount in your wallet at the time of the incident.' },
      { heading: '11. Termination', content: 'We reserve the right to:\n\n• Suspend or terminate your account at any time\n• Refuse service to anyone for any reason\n• Modify or discontinue services without notice\n\nUpon termination, your right to use the service ceases immediately. Remaining balance (if any) will be processed as per our refund policy.' },
      { heading: '12. Dispute Resolution', content: 'Any disputes arising from these terms shall be:\n\n• First attempted to be resolved through our support team\n• Subject to arbitration if not resolved amicably\n• Governed by the laws of India\n• Subject to the exclusive jurisdiction of courts in [City], India' },
      { heading: '13. Changes to Terms', content: 'We may modify these terms at any time. Changes will be effective upon posting. Your continued use of the service after changes constitutes acceptance. We recommend reviewing these terms periodically.' },
    ]
  },
  'responsible-gaming': {
    title: 'Responsible Gaming',
    sections: [
      { heading: 'Play Responsibly', content: 'Gaming should be fun and entertaining. At A2Z Ludo, we are committed to promoting responsible gaming practices. We encourage all players to:\n\n• Play for entertainment, not as a source of income\n• Set personal limits and stick to them\n• Take regular breaks during gaming sessions\n• Never play under the influence of alcohol or drugs\n• Balance gaming with other activities' },
      { heading: 'Set Your Limits', content: 'We encourage you to set personal limits:\n\n• Deposit Limits: Set daily, weekly, or monthly deposit limits\n• Time Limits: Decide how much time you want to spend gaming\n• Loss Limits: Set a maximum amount you\'re willing to lose\n• Session Reminders: Enable notifications for gaming duration\n\nYou can set these limits in your account settings. Once set, limits cannot be increased for 24 hours.' },
      { heading: 'Age Restriction', content: 'Our platform is strictly for users aged 18 and above.\n\n• We verify age during KYC process\n• Underage gaming is illegal and prohibited\n• Parents should monitor children\'s device usage\n• We cooperate with authorities on underage gaming cases\n\nIf you suspect underage gaming, please report to our support team immediately.' },
      { heading: 'Warning Signs of Problem Gaming', content: 'Be aware of these warning signs:\n\n• Spending more money than you can afford to lose\n• Gaming interfering with work, studies, or relationships\n• Borrowing money or selling possessions to play\n• Feeling anxious, irritable, or depressed when not playing\n• Lying to family or friends about gaming habits\n• Chasing losses by playing more\n• Neglecting personal hygiene or health\n• Failed attempts to cut back on gaming' },
      { heading: 'Self-Exclusion Options', content: 'If you feel you need a break, we offer:\n\n• Temporary Timeout: 24 hours to 30 days\n• Self-Exclusion: 6 months to permanent\n• Cool-off Period: Short breaks between sessions\n\nTo request self-exclusion:\n1. Go to Settings > Responsible Gaming\n2. Select your preferred exclusion period\n3. Confirm your decision\n\nDuring exclusion, you cannot access your account or create new accounts.' },
      { heading: 'Getting Help', content: 'If you or someone you know has a gaming problem, please seek help:\n\n• National Problem Gambling Helpline: 1800-XXX-XXXX\n• Gamblers Anonymous India: www.gaindia.org\n• iCall Psychosocial Helpline: 9152987821\n\nOur support team is also available 24/7 to assist you with responsible gaming concerns.' },
      { heading: 'Tips for Responsible Gaming', content: '• Only play with money you can afford to lose\n• Set a budget before you start playing\n• Take regular breaks - set a timer if needed\n• Don\'t chase your losses\n• Don\'t play when upset, stressed, or intoxicated\n• Keep track of time and money spent\n• Gaming should never be your primary source of income\n• Maintain a healthy balance with other activities' },
      { heading: 'Our Commitment', content: 'A2Z Ludo is committed to:\n\n• Providing tools for responsible gaming\n• Training our staff on responsible gaming practices\n• Identifying and helping at-risk players\n• Cooperating with regulatory authorities\n• Continuously improving our responsible gaming measures\n• Supporting research on responsible gaming' },
    ]
  },
  'tds-policy': {
    title: 'TDS Policy',
    sections: [
      { heading: 'Overview', content: 'In line with the provisions contained in Finance Act, 2023, the following TDS (Tax Deducted at Source) policy is applicable for all players on A2Z Ludo from April 1, 2023.\n\nThis policy explains how TDS is calculated and deducted on your winnings.' },
      { heading: 'Key Points', content: '• TDS is applicable at the time of withdrawal or deposit refund\n• 30% TDS is applicable on any positive net winnings at the time of withdrawal\n• TDS is also applicable at the end of financial year on year-end wallet balance\n• Net winnings = Total Withdrawals - Total Deposits (in a financial year)\n• April 1 to March 31 duration is considered a financial year\n• TDS is calculated on cumulative basis, not per transaction' },
      { heading: 'How TDS is Calculated', content: 'TDS Calculation Formula:\n\nNet Winnings = (Total Withdrawals in FY + Current Withdrawal) - Total Deposits in FY\n\nIf Net Winnings > 0:\n   TDS = Net Winnings × 30%\n\nIf Net Winnings ≤ 0:\n   TDS = ₹0 (No TDS applicable)\n\nAmount Credited = Withdrawal Amount - TDS' },
      { heading: 'Example Scenarios', content: 'Scenario 1: Net Winnings Positive\n• Total withdrawals in FY: ₹5,000\n• Total deposits in FY: ₹10,000\n• Current withdrawal: ₹7,000\n• Net winnings: (5,000 + 7,000) - 10,000 = ₹2,000\n• TDS (30%): ₹600\n• Amount credited: ₹6,400\n\nScenario 2: Net Winnings Negative (Loss)\n• Total withdrawals in FY: ₹3,000\n• Total deposits in FY: ₹10,000\n• Current withdrawal: ₹2,000\n• Net winnings: (3,000 + 2,000) - 10,000 = -₹5,000\n• TDS: ₹0 (No TDS as you\'re in loss)\n• Amount credited: ₹2,000' },
      { heading: 'TDS Already Paid', content: 'If you have already paid TDS in previous withdrawals during the same financial year:\n\n• The TDS paid is tracked cumulatively\n• No additional TDS until your net winnings exceed the amount on which TDS was already paid\n• This prevents double taxation on the same winnings' },
      { heading: 'Year-End TDS', content: 'At the end of the financial year (March 31):\n\n• TDS will be calculated on your account balance\n• The balance is treated as a deemed withdrawal\n• TDS is deducted from your wallet balance\n• Remaining amount is carried forward as opening deposit for next FY\n• This ensures all winnings are taxed appropriately' },
      { heading: 'TDS Certificate', content: 'Form 16A (TDS Certificate):\n\n• Will be issued for all TDS deducted\n• Available for download from your account\n• Can be used while filing Income Tax Return\n• Issued quarterly as per IT regulations\n• Contains your PAN, TDS amount, and other details' },
      { heading: 'PAN Card Requirement', content: 'PAN Card is mandatory for:\n\n• Withdrawals exceeding ₹10,000\n• Claiming TDS credit in ITR\n• Proper TDS reporting to IT department\n\nIf PAN is not provided:\n• Higher TDS rate of 30% applies\n• TDS credit may not be available' },
      { heading: 'TDS Refund', content: 'If excess TDS is deducted:\n\n• You can claim refund while filing ITR\n• Refund is processed by Income Tax Department\n• Use Form 16A for claiming credit\n• Refund timeline depends on IT Department processing' },
      { heading: 'Important Notes', content: '• TDS is deducted as per Income Tax Act, 1961\n• We report all TDS to Income Tax Department\n• Keep records of all transactions for ITR filing\n• Consult a tax professional for specific advice\n• Policy may change based on government regulations\n• We are not responsible for your tax compliance' },
      { heading: 'Disclaimer', content: 'This TDS Policy is based on our understanding of the provisions as introduced/amended by Finance Act, 2023. The Company reserves its right to modify/change/amend the TDS Policy based on law applicable at the relevant time.\n\nThis information is for general guidance only and should not be considered as tax advice. Please consult a qualified tax professional for advice specific to your situation.' },
    ]
  },
  'refund-policy': {
    title: 'Refund Policy',
    sections: [
      { heading: 'Overview', content: 'This Refund Policy outlines the terms and conditions under which refunds may be issued for transactions on A2Z Ludo. Please read this policy carefully before making any deposits.' },
      { heading: 'General Policy', content: 'As a general rule:\n\n• All deposits made on A2Z Ludo are non-refundable\n• Funds added to your wallet are meant for gameplay\n• We do not offer refunds for change of mind\n• Entry fees for games are non-refundable once the game starts\n• Winnings can only be withdrawn, not refunded to original payment method' },
      { heading: 'Eligible Refund Scenarios', content: 'Refunds may be considered in the following cases:\n\n1. Technical Errors:\n   • Duplicate transactions due to system error\n   • Failed transactions where amount was debited\n   • System malfunction causing incorrect deductions\n\n2. Unauthorized Transactions:\n   • Transactions made without your consent\n   • Fraudulent activity on your account\n   • Identity theft cases (with police report)\n\n3. Service Issues:\n   • Game cancellation due to server issues\n   • Inability to provide promised services\n   • Account closure by us without valid reason' },
      { heading: 'Non-Refundable Scenarios', content: 'Refunds will NOT be issued for:\n\n• Losses incurred during gameplay\n• Entry fees for completed games\n• Voluntary deposits made by the user\n• Account suspension due to policy violations\n• Self-exclusion or voluntary account closure\n• Disputes arising from fair gameplay\n• Change of mind after deposit\n• Incorrect amount deposited by user error' },
      { heading: 'Refund Request Process', content: 'To request a refund:\n\n1. Contact Support:\n   • Go to Settings > Help & Support\n   • Select "Refund Request" category\n   • Provide transaction details\n\n2. Required Information:\n   • Transaction ID\n   • Date and time of transaction\n   • Amount involved\n   • Reason for refund request\n   • Supporting documents (if any)\n\n3. Timeline:\n   • Submit request within 7 days of transaction\n   • We will respond within 48 hours\n   • Investigation may take up to 7 working days' },
      { heading: 'Refund Processing', content: 'If your refund is approved:\n\n• Refund will be processed within 7-10 working days\n• Amount will be credited to original payment method\n• For UPI/Bank transfers: 3-5 working days\n• For cards: 5-7 working days (depends on bank)\n• You will receive confirmation via SMS/email\n• TDS implications will be adjusted accordingly' },
      { heading: 'Partial Refunds', content: 'In some cases, partial refunds may be issued:\n\n• If part of the service was utilized\n• If promotional bonus was used\n• If TDS was already deducted\n• Based on investigation findings\n\nThe refund amount will be calculated based on the specific circumstances of each case.' },
      { heading: 'Bonus and Promotional Funds', content: 'Regarding bonus amounts:\n\n• Bonus funds are non-refundable\n• Bonus funds cannot be withdrawn directly\n• If deposit is refunded, associated bonus will be forfeited\n• Winnings from bonus funds follow standard withdrawal rules' },
      { heading: 'Dispute Resolution', content: 'If you disagree with our refund decision:\n\n1. Request a review within 7 days\n2. Provide additional supporting documents\n3. Our senior team will review the case\n4. Final decision will be communicated within 14 days\n5. Our decision on disputes is final and binding' },
      { heading: 'Contact Information', content: 'For refund-related queries:\n\n• Email: refunds@a2zludo.com\n• In-app Support: Available 24/7\n• Response time: Within 24-48 hours\n\nPlease include your registered phone number and transaction details in all communications.' },
    ]
  },
  'about-us': {
    title: 'About Us',
    sections: [
      { heading: 'Welcome to A2Z Ludo', content: 'A2Z Ludo is India\'s premier online Ludo gaming platform where skill meets entertainment. We bring the classic board game experience to your fingertips, allowing you to play anytime, anywhere, and win real rewards.\n\nOur mission is to provide a fair, secure, and entertaining gaming experience for millions of players across India.' },
      { heading: 'Our Story', content: 'Founded in 2023, A2Z Ludo was born from a simple idea: to recreate the joy of playing Ludo with friends and family in the digital age. What started as a passion project has grown into one of India\'s most trusted online gaming platforms.\n\nWe understand the nostalgia and excitement that Ludo brings, and we\'ve worked tirelessly to capture that essence while adding the thrill of competitive gaming.' },
      { heading: 'What We Offer', content: '• Classic Ludo Gameplay: Authentic Ludo experience with modern features\n• Multiple Game Modes: Play 1v1, 2v2, or multiplayer tournaments\n• Real Rewards: Win real money based on your skills\n• Secure Platform: Bank-grade security for all transactions\n• Fair Play: Advanced anti-cheat systems ensure fair gameplay\n• 24/7 Support: Dedicated customer support team\n• Instant Withdrawals: Quick and hassle-free withdrawals' },
      { heading: 'Our Values', content: 'Fairness:\nWe believe in providing a level playing field for all players. Our games are 100% skill-based with no element of chance manipulation.\n\nTransparency:\nWe maintain complete transparency in our operations, from game mechanics to financial transactions.\n\nSecurity:\nYour data and funds are protected with industry-leading security measures.\n\nResponsibility:\nWe promote responsible gaming and provide tools to help players maintain healthy gaming habits.' },
      { heading: 'Why Choose A2Z Ludo?', content: '✓ Trusted by millions of players\n✓ 100% legal and compliant\n✓ Instant deposits and withdrawals\n✓ No bots - play against real players only\n✓ Regular tournaments and rewards\n✓ Referral bonuses for inviting friends\n✓ Dedicated mobile app experience\n✓ Multiple payment options\n✓ KYC-verified secure platform' },
      { heading: 'Our Team', content: 'A2Z Ludo is powered by a passionate team of gaming enthusiasts, technology experts, and customer service professionals. Together, we work to deliver the best possible gaming experience.\n\nOur team includes:\n• Experienced game developers\n• Security and compliance experts\n• Customer support specialists\n• Data scientists for fair play monitoring' },
      { heading: 'Legal Compliance', content: 'A2Z Ludo operates in full compliance with Indian laws:\n\n• Registered company under Companies Act\n• GST compliant\n• TDS deduction as per Income Tax Act\n• Operates only in states where skill gaming is legal\n• Age verification (18+) mandatory\n• KYC compliance for all withdrawals' },
      { heading: 'Contact Us', content: 'We\'d love to hear from you!\n\nCustomer Support:\n• Email: support@a2zludo.com\n• In-app chat: Available 24/7\n\nBusiness Inquiries:\n• Email: business@a2zludo.com\n\nCareers:\n• Email: careers@a2zludo.com\n\nOffice Address:\n[Your Company Address]\n[City, State, PIN Code]\nIndia' },
      { heading: 'Join Our Community', content: 'Stay connected with us:\n\n• Follow us on Instagram: @a2zludo\n• Like us on Facebook: /a2zludo\n• Subscribe on YouTube: A2Z Ludo\n• Join our Telegram: t.me/a2zludo\n\nDownload the app now and start your winning journey!' },
    ]
  }
};

const Policies = () => {
  const [selectedPolicy, setSelectedPolicy] = useState('privacy-policy');
  const [policy, setPolicy] = useState(DEFAULT_POLICIES['privacy-policy']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPolicy();
  }, [selectedPolicy]);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPolicy(selectedPolicy);
      if (response.data.policy) {
        setPolicy(response.data.policy);
      } else {
        // Use default content if no saved policy
        setPolicy(DEFAULT_POLICIES[selectedPolicy]);
      }
    } catch (error) {
      // Use default content on error
      setPolicy(DEFAULT_POLICIES[selectedPolicy]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updatePolicy(selectedPolicy, policy);
      toast.success('Policy saved successfully');
    } catch (error) {
      toast.error('Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset to default content? This will discard your unsaved changes.')) {
      setPolicy(DEFAULT_POLICIES[selectedPolicy]);
      toast.success('Reset to default content');
    }
  };

  const addSection = () => {
    setPolicy((prev) => ({
      ...prev,
      sections: [...prev.sections, { heading: '', content: '' }],
    }));
  };

  const removeSection = (index) => {
    if (policy.sections.length <= 1) return;
    setPolicy((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const updateSection = (index, field, value) => {
    setPolicy((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      ),
    }));
  };

  const moveSection = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= policy.sections.length) return;
    const newSections = [...policy.sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setPolicy((prev) => ({ ...prev, sections: newSections }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 lg:mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Policy Editor</h1>
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 bg-gray-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600 text-sm"
        >
          <FaUndo /> Reset to Default
        </button>
      </div>

      {/* Policy Type Selector */}
      <div className="mb-4 lg:mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          {POLICY_TYPES.map((type) => (
            <button
              key={type.key}
              onClick={() => setSelectedPolicy(type.key)}
              className={`px-3 lg:px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                selectedPolicy === type.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Policy Editor */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-gray-700 flex items-center gap-3">
          <FaFileAlt className="text-blue-500" />
          <h2 className="text-lg font-semibold text-white">
            {POLICY_TYPES.find((p) => p.key === selectedPolicy)?.label}
          </h2>
        </div>

        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* Title */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Page Title</label>
            <input
              type="text"
              value={policy.title}
              onChange={(e) => setPolicy((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-blue-500"
              placeholder="Enter page title"
            />
          </div>

          {/* Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-gray-400 text-sm">
                Content Sections ({policy.sections.length})
              </label>
              <button
                onClick={addSection}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                <FaPlus /> Add Section
              </button>
            </div>

            {policy.sections.map((section, index) => (
              <div
                key={index}
                className="bg-gray-700/50 rounded-xl p-4 border border-gray-600"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm flex items-center gap-2">
                    <FaEdit /> Section {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveSection(index, -1)}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-white p-1 disabled:opacity-30"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveSection(index, 1)}
                      disabled={index === policy.sections.length - 1}
                      className="text-gray-400 hover:text-white p-1 disabled:opacity-30"
                      title="Move down"
                    >
                      ↓
                    </button>
                    {policy.sections.length > 1 && (
                      <button
                        onClick={() => removeSection(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Remove section"
                      >
                        <FaMinus />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={section.heading}
                    onChange={(e) => updateSection(index, 'heading', e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg outline-none border border-gray-600 focus:border-blue-500 text-sm"
                    placeholder="Section heading (e.g., '1. Introduction')"
                  />
                  <textarea
                    value={section.content}
                    onChange={(e) => updateSection(index, 'content', e.target.value)}
                    rows={6}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none border border-gray-600 focus:border-blue-500 text-sm resize-none"
                    placeholder="Section content..."
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <FaSave />
              {saving ? 'Saving...' : 'Save Policy'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-6 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Preview</h3>
        </div>
        <div className="p-4 lg:p-6 max-h-[500px] overflow-y-auto">
          <h1 className="text-2xl font-bold text-white mb-6">{policy.title}</h1>
          <div className="space-y-6 text-gray-300">
            {policy.sections.map((section, index) => (
              <div key={index}>
                {section.heading && (
                  <h2 className="text-lg font-bold text-white mb-2">{section.heading}</h2>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Policies;
