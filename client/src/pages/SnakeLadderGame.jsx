import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUpload } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { gameAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import { addTimestampToImage } from '../utils/addTimestampToImage';

const SnakeLadderGame = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [showCancelReasons, setShowCancelReasons] = useState(false);
  const [showLostConfirm, setShowLostConfirm] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [hasSubmittedResult, setHasSubmittedResult] = useState(false);
  const [showCancelRequestDialog, setShowCancelRequestDialog] = useState(false);
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const fileInputRef = useRef(null);

  // Check if there's a pending cancellation request from opponent
  const hasPendingCancellationRequest = battle?.cancellationRequest && 
    battle.cancellationRequest.status === 'pending' &&
    battle.cancellationRequest.requestedBy !== user?.id;
  
  // Show cancellation request dialog
  useEffect(() => {
    if (hasPendingCancellationRequest) {
      setShowCancelRequestDialog(true);
    } else {
      setShowCancelRequestDialog(false);
    }
  }, [hasPendingCancellationRequest]);

  // Check for winner celebration
  useEffect(() => {
    if (battle?.status === 'completed' && battle?.winner?._id === user?.id) {
      if (!sessionStorage.getItem(`win_celebrated_${roomCode}`)) {
        setShowWinCelebration(true);
        sessionStorage.setItem(`win_celebrated_${roomCode}`, 'true');
      }
    }
  }, [battle?.status, battle?.winner?._id, user?.id, roomCode]);

  // Check if cancellation request was rejected
  useEffect(() => {
    if (battle?.cancellationRequest && 
        battle.cancellationRequest.status === 'rejected' &&
        battle.cancellationRequest.requestedBy === user?.id) {
      
      const rejectionKey = `cancel_rejected_${roomCode}_${battle.cancellationRequest.respondedAt}`;
      if (!sessionStorage.getItem(rejectionKey)) {
        toast.error('Your cancellation request was rejected by opponent. Game continues.', {
          duration: 5000,
          icon: '❌'
        });
        sessionStorage.setItem(rejectionKey, 'true');
      }
    }
  }, [battle?.cancellationRequest?.status, battle?.cancellationRequest?.requestedBy, user?.id, roomCode]);

  useEffect(() => {
    fetchBattleDetails();
    const interval = setInterval(fetchBattleDetails, 3000);
    return () => clearInterval(interval);
  }, [roomCode]);

  useEffect(() => {
    if (battle?.status === 'in_progress' && battle?.startedAt) {
      const startTime = new Date(battle.startedAt).getTime();
      const currentTime = new Date().getTime();
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
      const remainingTime = Math.max(0, 1800 - elapsedSeconds); // 30 minutes = 1800 seconds
      setTimeLeft(remainingTime);
      if (remainingTime > 0) {
        const timer = setTimeout(() => setTimeLeft(remainingTime - 1), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [battle]);

  const fetchBattleDetails = async () => {
    try {
      const response = await gameAPI.getGameDetails(roomCode);
      const gameData = response.data.game;
      setBattle(gameData);
      const currentPlayer = gameData.players?.find(p => p.user._id === user?.id);
      if (currentPlayer?.result) setHasSubmittedResult(true);
    } catch (error) {
      toast.error('Failed to load battle details');
      navigate('/snake-ladder-lobby');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image size should be less than 5MB'); return; }
    try {
      const watermarked = await addTimestampToImage(file);
      setScreenshot(watermarked);
      setScreenshotPreview(URL.createObjectURL(watermarked));
    } catch {
      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadWinScreenshot = async () => {
    if (!screenshot) { toast.error('Please select a screenshot'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('screenshot', screenshot);
      formData.append('roomCode', roomCode);
      await gameAPI.uploadWinScreenshot(formData);
      await gameAPI.submitGameResult(roomCode, 'won');
      toast.success('Screenshot uploaded and result submitted!');
      setScreenshot(null); setScreenshotPreview(''); setShowUploadDialog(false); setHasSubmittedResult(true);
      fetchBattleDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload screenshot');
    } finally { setUploading(false); }
  };

  const handleCancelBattle = async () => {
    setShowCancelReasons(false);
    try {
      // Check if game has started (both players joined)
      if (battle.currentPlayers === 2 && (battle.status === 'in_progress' || battle.status === 'accepted')) {
        // Request mutual cancellation
        await gameAPI.requestCancellation(roomCode);
        toast.success('Cancellation request sent to opponent. Waiting for response...');
      } else {
        // Direct cancel (only creator, before second player joins)
        const response = await gameAPI.cancelGame(roomCode);
        toast.success(`Battle cancelled! ₹${response.data.refundedAmount} refunded`);
        navigate('/snake-ladder-lobby');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel battle');
    }
  };

  const handleRespondToCancellation = async (accept) => {
    try {
      const response = await gameAPI.respondToCancellation(roomCode, accept);
      
      if (accept) {
        toast.success(`Game cancelled by mutual agreement! ₹${response.data.refundedAmount} refunded to your wallet`);
        navigate('/snake-ladder-lobby');
      } else {
        toast.success('Cancellation request rejected. Game continues.');
        setShowCancelRequestDialog(false);
      }
      
      fetchBattleDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to respond');
    }
  };

  const handleSubmitLost = async () => {
    try {
      await gameAPI.submitGameResult(roomCode, 'lost');
      setShowLostConfirm(false); setHasSubmittedResult(true);
      toast.success('Game result submitted');
      fetchBattleDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit result');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500"></div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-800 text-xl font-bold">Battle not found</p>
          <button onClick={() => navigate('/snake-ladder-lobby')} className="mt-4 bg-purple-500 text-white px-6 py-2 rounded-xl font-bold">Back to Lobby</button>
        </div>
      </div>
    );
  }

  const isPlayer = battle.players?.some(p => p.user._id === user?.id);
  const currentPlayer = battle.players?.find(p => p.user._id === user?.id);
  const isCreator = battle.players?.[0]?.user._id === user?.id;
  
  // Cancel button is always enabled during game (except when result submitted)
  const canCancel = !hasSubmittedResult && battle.status !== 'completed' && battle.status !== 'cancelled';
  
  const player1 = battle.players?.[0];
  const player2 = battle.players?.[1];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-50 p-4 pb-24">
      {/* Game Label */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-3xl">🐍</span>
        <h1 className="text-xl font-black text-purple-700">Snake & Ladder Battle</h1>
        <span className="text-3xl">🪜</span>
      </div>

      {/* Player VS Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-2xl p-4 mb-4 shadow-xl border-2 border-purple-300">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-black text-2xl mb-2 shadow-lg">
              {player1?.user?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <p className="text-gray-800 font-bold text-sm">{player1?.user?.username || player1?.user?.phoneNumber?.slice(-4) || 'Player 1'}</p>
            <div className="mt-2">
              <p className="text-gray-400 text-xs">Entry</p>
              <p className="text-green-600 font-bold">₹{battle.entryFee}</p>
            </div>
          </div>

          <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">VS</div>

          <div className="flex flex-col items-center">
            {player2 ? (
              <>
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-teal-500 rounded-full flex items-center justify-center text-white font-black text-2xl mb-2 shadow-lg">
                  {player2?.user?.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <p className="text-gray-800 font-bold text-sm">{player2?.user?.username || player2?.user?.phoneNumber?.slice(-4) || 'Player 2'}</p>
                <div className="mt-2">
                  <p className="text-gray-400 text-xs">Prize</p>
                  <p className="text-purple-600 font-bold">₹{battle.prizePool.toFixed(1)}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 font-black text-2xl mb-2">?</div>
                <p className="text-gray-400 font-bold text-sm">Waiting...</p>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Room Code Section */}
      {(battle.status === 'accepted' || battle.status === 'in_progress') && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 mb-4 shadow-xl border-2 border-purple-300">
          <p className="text-center text-gray-700 text-sm mb-2 font-semibold">Enter the Room Code for Snake & Ladder</p>
          <p className="text-center text-yellow-600 font-bold text-lg mb-4">
            Time left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')} Min
          </p>

          {isCreator ? (
            battle.gameRoomCode ? (
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 text-center">
                <p className="text-green-700 font-bold text-lg mb-1">Room Code Set</p>
                <p className="text-green-600 text-2xl font-black">{battle.gameRoomCode}</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="text" value={roomCodeInput} onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())} placeholder="Enter Room Code" className="flex-1 bg-white border-2 border-gray-300 px-4 py-3 rounded-xl text-gray-800 font-bold outline-none focus:border-purple-500 transition-all" />
                <button onClick={async () => { if (roomCodeInput.trim()) { try { await gameAPI.setGameRoomCode(roomCode, roomCodeInput); toast.success('Room code set!'); fetchBattleDetails(); } catch (e) { toast.error('Failed'); } } else { toast.error('Enter a room code'); } }} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg">SET</button>
              </div>
            )
          ) : (
            battle.gameRoomCode ? (
              <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4 text-center">
                <p className="text-purple-700 font-bold text-lg mb-1">Room Code</p>
                <p className="text-purple-600 text-2xl font-black">{battle.gameRoomCode}</p>
              </div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 text-center">
                <p className="text-yellow-700 font-bold">Waiting for creator to set room code...</p>
              </div>
            )
          )}
        </motion.div>
      )}

      {/* Update Status */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 mb-4 shadow-xl border-2 border-purple-300">
        <h2 className="text-purple-600 font-bold text-xl mb-2 text-center">Update Game Status</h2>

        {battle.status === 'completed' ? (
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 text-center">
            <p className="text-green-700 font-bold text-lg mb-2">✅ Game Completed</p>
            <p className="text-green-600 text-sm">
              {battle.winner 
                ? `Winner declared! ${battle.winner.username || battle.winner.phoneNumber} won ₹${battle.prizePool.toFixed(1)}`
                : 'Results submitted. Winner will be announced soon.'}
            </p>
          </div>
        ) : battle.status === 'disputed' ? (
          <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 text-center">
            <p className="text-orange-700 font-bold text-lg mb-2">⚠️ Dispute Occurred</p>
            <p className="text-orange-600 text-sm">Both players have chosen the same result. Admin will review and decide the winner.</p>
          </div>
        ) : hasSubmittedResult ? (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 text-center mb-4">
            <p className="text-blue-700 font-bold text-lg mb-2">✓ Your Result Submitted</p>
            <p className="text-blue-600 text-sm">Waiting for opponent...</p>
          </div>
        ) : (
          <p className="text-gray-700 text-sm text-center mb-4">After finishing your game, select the status and upload your screenshot.</p>
        )}

        <div className="flex gap-3">
          <button onClick={() => { if (!hasSubmittedResult) setShowUploadDialog(true); }} disabled={!isPlayer || battle.status !== 'in_progress' || hasSubmittedResult} className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">I Won</button>
          <button onClick={() => { if (!hasSubmittedResult) setShowLostConfirm(true); }} disabled={!isPlayer || battle.status !== 'in_progress' || hasSubmittedResult} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">I Lost</button>
          <button onClick={() => setShowCancelReasons(true)} disabled={!canCancel} className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">Cancel</button>
        </div>
      </motion.div>

      {/* Cancel Dialog */}
      {showCancelReasons && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black text-gray-800 mb-4 text-center">Select Cancel Reason</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['No Room code', 'Not Joined', 'Not Playing', "Don't want to play", 'Opponent Abusing', 'Other'].map(r => (
                <button key={r} onClick={handleCancelBattle} className="bg-gray-700 text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-600 transition-all text-sm">{r}</button>
              ))}
            </div>
            <button onClick={() => setShowCancelReasons(false)} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold">Close</button>
          </motion.div>
        </div>
      )}

      {/* Upload Screenshot Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black text-gray-800 mb-4 text-center text-purple-600">Upload Result Screenshot</h2>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
            {screenshotPreview ? (
              <div className="mb-4">
                <img src={screenshotPreview} alt="Preview" className="w-full h-64 object-contain rounded-xl border-2 border-gray-300 bg-gray-50" />
                <button onClick={() => { setScreenshot(null); setScreenshotPreview(''); }} className="w-full mt-3 bg-red-100 text-red-600 py-2 rounded-xl font-bold hover:bg-red-200 transition-all">Remove</button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} className="w-full h-48 border-4 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-purple-500 hover:bg-purple-50 transition-all mb-4">
                <FaUpload className="text-5xl text-gray-400" />
                <p className="text-gray-600 font-bold">Click to upload screenshot</p>
              </button>
            )}
            <button onClick={handleUploadWinScreenshot} disabled={!screenshot || uploading} className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50 shadow-lg mb-3">{uploading ? 'Uploading...' : 'Submit'}</button>
            <button onClick={() => { setShowUploadDialog(false); setScreenshot(null); setScreenshotPreview(''); }} className="w-full bg-gray-200 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all">Close</button>
          </motion.div>
        </div>
      )}

      {/* Lost Confirmation */}
      {showLostConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-black text-gray-800 mb-6 text-center">Are you sure you Lost this game?</h2>
            <div className="flex gap-3">
              <button onClick={handleSubmitLost} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg">Yes, I Lost</button>
              <button onClick={() => setShowLostConfirm(false)} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg">No</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancellation Request Dialog */}
      {showCancelRequestDialog && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-orange-500"
          >
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">⚠️</div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">
                Cancellation Request
              </h2>
              <p className="text-gray-600">
                Your opponent wants to cancel this game. Both players will be refunded if you accept.
              </p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 mb-6">
              <p className="text-blue-800 text-sm font-semibold">
                ℹ️ If you accept, both players will get ₹{battle.entryFee} refunded to their wallets.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleRespondToCancellation(true)}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
              >
                ✓ Accept
              </button>
              <button
                onClick={() => handleRespondToCancellation(false)}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
              >
                ✕ Reject
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Win Celebration Dialog */}
      {showWinCelebration && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border-4 border-yellow-400"
          >
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-black text-gray-800 mb-2">
              You Won!
            </h2>
            <p className="text-gray-600 mb-6 font-semibold">
              Congratulations! You have won <span className="text-green-600 font-bold text-xl">₹{battle.prizePool.toFixed(1)}</span>
            </p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/withdrawal')}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 py-4 rounded-xl font-black text-lg hover:scale-105 transition-all shadow-xl shadow-yellow-500/30"
              >
                💸 Withdraw Winnings
              </button>
              <button
                onClick={() => setShowWinCelebration(false)}
                className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SnakeLadderGame;
