import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { gameAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import { getCommissionRate } from '../utils/config';

const GameLobby = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [entryAmount, setEntryAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [openBattles, setOpenBattles] = useState([]);
  const [runningBattles, setRunningBattles] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedBattle, setSelectedBattle] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [commissionRate, setCommissionRate] = useState(5);

  useEffect(() => {
    fetchBattles();
    fetchCommission();
    const interval = setInterval(fetchBattles, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchCommission = async () => {
    const rate = await getCommissionRate();
    setCommissionRate(rate);
  };

  const fetchBattles = async () => {
    try {
      const response = await gameAPI.getAvailableGames();
      const games = response.data.games || [];
      setOpenBattles(games.filter(g => g.status === 'waiting'));
      setRunningBattles(games.filter(g => g.status === 'accepted' || g.status === 'in_progress'));
    } catch (error) {
      console.error('Failed to fetch battles:', error);
    }
  };

  const handleCreateBattle = async () => {
    if (!entryAmount || parseFloat(entryAmount) < 10) {
      toast.error('Minimum entry amount is ₹10');
      return;
    }

    const amount = parseFloat(entryAmount);
    const totalBalance = (user?.depositCash || 0) + (user?.winningCash || 0) + (user?.bonusCash || 0);

    if (totalBalance < amount) {
      toast.error(`Insufficient balance! You have ₹${totalBalance.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      const response = await gameAPI.createGame({
        entryFee: parseFloat(entryAmount)
      });
      
      toast.success('Battle created successfully! Waiting for opponent...');
      setEntryAmount('');
      fetchBattles();
      
      // Keep creator on lobby page instead of redirecting
      // navigate(`/battle/${response.data.game.roomCode}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create battle');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinBattle = async (battle) => {
    const totalBalance = (user?.depositCash || 0) + (user?.winningCash || 0) + (user?.bonusCash || 0);

    if (totalBalance < battle.entryFee) {
      toast.error(`Insufficient balance! You need ₹${battle.entryFee}`);
      return;
    }

    setLoading(true);
    try {
      await gameAPI.joinGame(battle.roomCode);
      
      toast.success('Joined battle successfully! Funds deducted.');
      fetchBattles();
      
      // Navigate to battle room
      navigate(`/battle/${battle.roomCode}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join battle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8f5d0] p-4 pb-24">

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto border-2 border-blue-500 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                <span className="text-3xl">📜</span>
                Game Rules
              </h2>
              <button
                onClick={() => setShowRules(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl font-bold transition-all"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-gray-700">
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
                <h3 className="text-blue-600 font-bold text-lg mb-2 flex items-center gap-2">
                  🎮 How to Play
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Create a battle by entering amount and room code</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Share the room code with your opponent or join an open battle</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Both players use the room code to play on Ludo King or any Ludo app</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600">•</span>
                    <span>After winning, upload a screenshot as proof</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Admin verifies and credits the winner</span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
                <h3 className="text-green-600 font-bold text-lg mb-2 flex items-center gap-2">
                  💰 Winning & Prizes
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="text-green-600">•</span>
                    <span>Winner takes the entire prize pool (minus {commissionRate}% commission)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600">•</span>
                    <span>Prize = Entry Fee × 2 players × {((100 - commissionRate) / 100).toFixed(2)}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600">•</span>
                    <span>Upload clear win screenshot for verification</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600">•</span>
                    <span>Instant credit to winning wallet after admin approval</span>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                <h3 className="text-yellow-600 font-bold text-lg mb-2 flex items-center gap-2">
                  ⚠️ Important Rules
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>Minimum entry amount is ₹10</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>Entry fee is deducted immediately when creating/joining</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>Both players must upload win screenshot</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>Admin decision is final in case of disputes</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>Fake screenshots lead to permanent ban</span>
                  </li>
                </ul>
              </div>

              <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4">
                <h3 className="text-purple-600 font-bold text-lg mb-2 flex items-center gap-2">
                  📱 How to Use Room Code
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="text-purple-600">•</span>
                    <span>Open Ludo King or any Ludo app on your phone</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-purple-600">•</span>
                    <span>Create a private room with the same room code</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-purple-600">•</span>
                    <span>Both players join using the room code</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-purple-600">•</span>
                    <span>Play the game and take screenshot of result</span>
                  </li>
                </ul>
              </div>

              <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
                <h3 className="text-orange-600 font-bold text-lg mb-2 flex items-center gap-2">
                  🎁 Referral Bonus
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="text-orange-600">•</span>
                    <span>Earn 3% commission on every friend's game</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-600">•</span>
                    <span>Share your referral code and start earning</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-600">•</span>
                    <span>Unlimited referral earnings</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
            >
              Got It!
            </button>
          </motion.div>
        </div>
      )}
      {/* Info Banner */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-4 mb-4 shadow-xl border-2 border-green-400"
      >
        <p className="text-white text-sm font-semibold text-center">
          ⚡ {commissionRate}% Commission • 3% Referral • 24/7 Withdrawal • WhatsApp Support 📞
        </p>
      </motion.div>

      {/* Balance Display */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 mb-6 shadow-xl border-2 border-purple-400"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-xs font-semibold mb-1">Your Balance</p>
            <p className="text-white text-2xl font-black">
              ₹{((user?.depositCash || 0) + (user?.winningCash || 0) + (user?.bonusCash || 0)).toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => navigate('/wallet')}
            className="bg-white text-purple-600 px-4 py-2 rounded-xl font-bold hover:scale-105 transition-all shadow-lg text-sm"
          >
            Add Cash
          </button>
        </div>
      </motion.div>

      {/* Create a Battle */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl p-6 mb-6 shadow-lg border-2 border-gray-200"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <span className="text-3xl">⚔️</span>
            Create Battle
          </h2>
          <button 
            onClick={() => setShowRules(true)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs sm:text-sm hover:bg-blue-700 transition-all shadow-lg"
          >
            Rules
          </button>
        </div>

        <div className="relative mb-4">
          <input
            type="number"
            value={entryAmount}
            onChange={(e) => setEntryAmount(e.target.value)}
            placeholder="Enter Amount"
            className="w-full bg-white border-2 border-gray-300 pl-4 pr-20 sm:pr-24 py-3 rounded-xl text-gray-800 text-base outline-none focus:border-purple-500 transition-all placeholder-gray-500"
          />
          <button
            onClick={handleCreateBattle}
            disabled={loading}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 sm:px-6 py-2 rounded-lg font-bold text-sm sm:text-base hover:scale-105 transition-all disabled:opacity-50 shadow-lg"
          >
            {loading ? '...' : 'SET'}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[50, 100, 250, 500].map((amount) => (
            <button
              key={amount}
              onClick={() => setEntryAmount(amount.toString())}
              className="bg-gray-200 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all border border-gray-300"
            >
              ₹{amount}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Open Battles */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="bg-gradient-to-r from-green-600 to-teal-600 p-4 rounded-t-2xl flex items-center gap-3 shadow-xl">
          <span className="text-3xl">🎯</span>
          <h3 className="text-xl font-black text-white">Open Battles</h3>
          <span className="ml-auto bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-bold">
            {openBattles.length}
          </span>
        </div>

        <div className="space-y-3 mt-3">
          {openBattles.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border-2 border-gray-200 shadow-lg">
              <p className="text-gray-600 text-lg font-bold">No open battles available</p>
              <p className="text-gray-500 text-sm mt-2">Create one to start playing!</p>
            </div>
          ) : (
            // Sort battles to show creator's battles first
            [...openBattles]
              .sort((a, b) => {
                const aIsCreator = a.players?.[0]?.user?._id === user?.id || a.players?.[0]?.user === user?.id;
                const bIsCreator = b.players?.[0]?.user?._id === user?.id || b.players?.[0]?.user === user?.id;
                
                // Creator's battles come first
                if (aIsCreator && !bIsCreator) return -1;
                if (!aIsCreator && bIsCreator) return 1;
                return 0;
              })
              .map((battle, index) => {
              const isCreator = battle.players && battle.players[0] && battle.players[0].user && 
                                (battle.players[0].user._id === user?.id || battle.players[0].user === user?.id);
              const creatorName = battle.players && battle.players[0] && battle.players[0].user 
                                  ? (battle.players[0].user.username || battle.players[0].user.phoneNumber || 'Player')
                                  : 'Player';
              
              return (
              <motion.div
                key={battle._id || battle.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 shadow-xl border-2 border-gray-700"
              >
                {/* Header with creator name and delete button */}
                <div className="mb-3 pb-2 border-b border-gray-700 flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs">Challenge From</p>
                    <p className="text-white font-bold text-base">{creatorName}</p>
                  </div>
                  {isCreator && (
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to cancel this battle?')) {
                          try {
                            const response = await gameAPI.cancelGame(battle.roomCode);
                            toast.success(`Battle cancelled! ₹${response.data.refundedAmount} refunded`);
                            fetchBattles();
                          } catch (error) {
                            toast.error(error.response?.data?.message || 'Failed to cancel');
                          }
                        }
                      }}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg font-bold text-xs hover:bg-red-600 transition-all"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  {/* Entry Fee */}
                  <div>
                    <p className="text-gray-400 text-xs mb-1">ENTRY FEE</p>
                    <div className="flex items-center gap-1">
                      <span className="text-green-400 text-xs">₹</span>
                      <span className="text-green-400 font-black text-xl">{battle.entryFee}</span>
                    </div>
                  </div>

                  {/* Prize */}
                  <div>
                    <p className="text-gray-400 text-xs mb-1">PRIZE</p>
                    <div className="flex items-center gap-1">
                      <span className="text-green-400 text-xs">₹</span>
                      <span className="text-green-400 font-black text-xl">{battle.prizePool.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {isCreator ? (
                      battle.currentPlayers === 2 && battle.status === 'waiting' ? (
                        // Show Start and Reject buttons when opponent has joined
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await gameAPI.acceptBattle(battle.roomCode);
                                toast.success('Battle accepted!');
                                navigate(`/battle/${battle.roomCode}`);
                              } catch (error) {
                                toast.error(error.response?.data?.message || 'Failed to accept');
                              }
                            }}
                            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 transition-all shadow-lg"
                          >
                            Start
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Reject this player? They will be refunded.')) {
                                try {
                                  await gameAPI.rejectBattle(battle.roomCode);
                                  toast.success('Player rejected and refunded');
                                  fetchBattles();
                                } catch (error) {
                                  toast.error(error.response?.data?.message || 'Failed to reject');
                                }
                              }
                            }}
                            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 transition-all shadow-lg"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        // Show loading spinner and View button while waiting
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                          <p className="text-gray-400 text-xs">Waiting...</p>
                          <button
                            onClick={() => navigate(`/battle/${battle.roomCode}`)}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-1 rounded-lg font-bold text-xs hover:scale-105 transition-all shadow-lg"
                          >
                            View
                          </button>
                        </div>
                      )
                    ) : (
                      <button
                        onClick={() => handleJoinBattle(battle)}
                        disabled={loading}
                        className="bg-gradient-to-r from-teal-400 to-teal-500 text-white px-6 py-2 rounded-xl font-bold hover:scale-105 transition-all shadow-lg disabled:opacity-50"
                      >
                        PLAY
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )})
          )}
        </div>
      </motion.div>

      {/* Running Battles */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-t-2xl flex items-center gap-3 shadow-xl">
          <span className="text-3xl">🔥</span>
          <h3 className="text-xl font-black text-white">Running Battles</h3>
          <span className="ml-auto bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-bold">
            {runningBattles.length}
          </span>
        </div>

        <div className="space-y-3 mt-3">
          {runningBattles.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border-2 border-gray-200 shadow-lg">
              <p className="text-gray-600 text-lg font-bold">No running battles</p>
              <p className="text-gray-500 text-sm mt-2">Games will appear here once started</p>
            </div>
          ) : (
            runningBattles.map((battle, index) => {
              const isMyBattle = battle.players?.some(p => p && p.user && (p.user._id === user?.id || p.user === user?.id));
              
              return (
              <motion.div
                key={battle._id || battle.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 shadow-xl border-2 border-orange-500/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white font-bold">Playing</p>
                  
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Entry Fee</p>
                    <p className="text-green-400 font-black text-2xl">₹{battle.entryFee}</p>
                  </div>

                  <div className="text-4xl">⚔️</div>

                  <div className="text-right">
                    <p className="text-gray-400 text-sm mb-1">Prize</p>
                    <p className="text-yellow-400 font-black text-2xl">₹{battle.prizePool}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-orange-500/20 border border-orange-500 rounded-xl p-2 text-center">
                    <p className="text-orange-400 font-bold text-sm">🔴 LIVE</p>
                  </div>
                  {isMyBattle && (
                    <button
                      onClick={() => navigate(`/battle/${battle.roomCode}`)}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
                    >
                      View Battle
                    </button>
                  )}
                </div>
              </motion.div>
            )})
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default GameLobby;
