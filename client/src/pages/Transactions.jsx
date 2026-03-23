import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { walletAPI } from '../services/api';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await walletAPI.getTransactions(1, 20);
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'deposit': return 'text-green-400';
      case 'withdrawal': return 'text-blue-400';
      case 'game_win': return 'text-yellow-400';
      case 'game_entry': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#e8f5d0] p-4 pb-24">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Transactions</h1>

      {loading ? (
        <div className="text-center text-gray-400 py-10">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center text-gray-400 py-10">No transactions yet</div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction, index) => (
            <motion.div
              key={transaction._id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-semibold ${getTypeColor(transaction.type)}`}>
                  {transaction.type.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-white font-bold">₹{transaction.amount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{transaction.transactionId}</span>
                <span className={`px-2 py-1 rounded ${
                  transaction.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {transaction.status}
                </span>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                {new Date(transaction.createdAt).toLocaleString()}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Transactions;
