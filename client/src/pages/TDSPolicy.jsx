import { useState } from 'react';
import { motion } from 'framer-motion';

const TDSPolicy = () => {
  const [totalWithdrawals, setTotalWithdrawals] = useState('');
  const [totalDeposits, setTotalDeposits] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [netWinnings, setNetWinnings] = useState(0);
  const [tdsAmount, setTdsAmount] = useState(0);

  const calculateTDS = () => {
    const withdrawals = parseFloat(totalWithdrawals) || 0;
    const deposits = parseFloat(totalDeposits) || 0;
    const withdrawal = parseFloat(withdrawalAmount) || 0;

    const netWin = (withdrawals + withdrawal) - deposits;
    const tds = netWin > 0 ? netWin * 0.30 : 0;

    setNetWinnings(netWin);
    setTdsAmount(tds);
  };

  return (
    <div className="min-h-screen bg-[#e8f5d0] p-4 pb-24">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-gray-700 max-w-4xl mx-auto"
      >
        <h1 className="text-3xl font-black text-white mb-6">TDS Policy</h1>
        
        <div className="space-y-6 text-gray-300">
          <section>
            <p className="text-yellow-400 font-bold mb-2">In line with the provisions contained in Finance Act, 2023, following TDS policy is applicable for all players on A2Z Ludo from 1 Apr, 2023.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Key Points</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>TDS is applicable at the time of withdrawal or deposit refund</li>
              <li>30% TDS is applicable on any positive net winnings at the time of withdrawal</li>
              <li>TDS is also applicable at the end of financial year on year end wallet balance</li>
              <li>Net winnings = Total Withdrawals - Total Deposits (in a financial year)</li>
              <li>Apr 1 to Mar 31 duration is considered a financial year</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">How Current TDS Policy Works</h2>
            <p className="mb-2">Post Apr 1, 2023:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>When you win an amount (e.g., ₹11,000), NO TDS is deducted while crediting to your wallet</li>
              <li>Entire winning amount is transferred to your winnings wallet</li>
              <li>TDS is calculated only when you withdraw</li>
              <li>If you're in loss, there will be no TDS</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Scenarios</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-700/50 p-4 rounded-xl">
                <h3 className="font-bold text-white mb-2">Scenario 1: Net Winnings More Than 0</h3>
                <div className="space-y-1 text-sm">
                  <p>Total withdrawals in FY: ₹5,000</p>
                  <p>Total deposits in FY: ₹10,000</p>
                  <p>Amount being withdrawn: ₹7,000</p>
                  <p className="text-yellow-400">Net winnings: ₹2,000</p>
                  <p className="text-red-400">30% TDS: ₹600</p>
                  <p className="text-green-400">Amount credited: ₹6,400</p>
                </div>
              </div>

              <div className="bg-gray-700/50 p-4 rounded-xl">
                <h3 className="font-bold text-white mb-2">Scenario 2: TDS Already Paid</h3>
                <p className="text-sm">If you have paid TDS in previous withdrawals, no TDS is applicable on withdrawals till your net winnings crosses the amount for which you have already paid TDS.</p>
              </div>

              <div className="bg-gray-700/50 p-4 rounded-xl">
                <h3 className="font-bold text-white mb-2">Scenario 3: Net Winnings Reduced</h3>
                <p className="text-sm">If your net winnings reduce after paying TDS, the excess TDS deducted can be claimed as refund in your annual income tax filing.</p>
              </div>

              <div className="bg-gray-700/50 p-4 rounded-xl">
                <h3 className="font-bold text-white mb-2">Scenario 4: End of Financial Year</h3>
                <p className="text-sm">At the end of the financial year, TDS will be calculated on your account balance by considering it as a withdrawal. Remaining amount will be carried forward to next year as starting deposit amount.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Important Notes</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>PAN card details are mandatory for withdrawals exceeding ₹10,000</li>
              <li>Form 16A (TDS Certificate) will be issued for tax deducted</li>
              <li>The certificate can be used while filing Income Tax Return</li>
              <li>Policy is subject to applicable law and may be modified</li>
            </ul>
          </section>

          {/* TDS Calculator */}
          <section className="mt-8">
            <h2 className="text-2xl font-black text-white mb-4">TDS Calculator</h2>
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-6 rounded-2xl border-2 border-blue-500">
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Total Withdrawals in this Financial Year (A):
                  </label>
                  <input
                    type="number"
                    value={totalWithdrawals}
                    onChange={(e) => setTotalWithdrawals(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl outline-none border-2 border-gray-600 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Total Deposits in the Financial Year (B):
                  </label>
                  <input
                    type="number"
                    value={totalDeposits}
                    onChange={(e) => setTotalDeposits(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl outline-none border-2 border-gray-600 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Amount Being Withdrawn By the Player (C):
                  </label>
                  <input
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl outline-none border-2 border-gray-600 focus:border-blue-500 transition-all"
                  />
                </div>

                <button
                  onClick={calculateTDS}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-4 rounded-xl hover:scale-105 transition-all shadow-lg"
                >
                  Calculate TDS
                </button>

                {(netWinnings !== 0 || tdsAmount !== 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-3"
                  >
                    <div className="bg-gray-700 p-4 rounded-xl">
                      <p className="text-gray-400 text-sm mb-1">Net Winnings (A+C-B):</p>
                      <p className="text-2xl font-black text-yellow-400">₹{netWinnings.toFixed(2)}</p>
                    </div>

                    <div className="bg-gray-700 p-4 rounded-xl">
                      <p className="text-gray-400 text-sm mb-1">TDS Applicable (30% on net winnings):</p>
                      <p className="text-2xl font-black text-red-400">₹{tdsAmount.toFixed(2)}</p>
                    </div>

                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-xl">
                      <p className="text-white text-sm mb-1">Amount to be Credited:</p>
                      <p className="text-3xl font-black text-white">
                        ₹{(parseFloat(withdrawalAmount) - tdsAmount).toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </section>

          <section className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500 rounded-xl">
            <p className="text-yellow-400 font-bold mb-2">⚠️ Disclaimer</p>
            <p className="text-sm">The TDS Policy is based on the understanding of the provisions as introduced/amended by Finance Act, 2023. The Company reserves its right to modify/change/amend the TDS Policy basis law applicable at the relevant time.</p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default TDSPolicy;
