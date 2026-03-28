import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUpload } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { gameAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import { addTimestampToImage } from '../utils/addTimestampToImage';

const BattleRoom = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user, fetchUser } = useAuthStore();
  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [showCancelReasons, setShowCancelReasons] = useState(false);
  const [showLostConfirm, setShowLostConfirm] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [hasSubmittedResult, setHasSubmittedResult] = useState(false);
  const [showCancelRequestDialog, setShowCancelRequestDialog] = useState(false);
  const fileInputRef = useRef(null);

  // Language toggle for instructions
  const [instructLang, setInstructLang] = useState('hi'); // 'en' or 'hi'

  const [showWinCelebration, setShowWinCelebration] = useState(false);

  useEffect(() => {
    fetchBattleDetails();
    
    const battleInterval = setInterval(fetchBattleDetails, 3000);
    
    return () => {
      clearInterval(battleInterval);
    };
  }, [roomCode]);

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

  // Timer countdown
  useEffect(() => {
    if (battle?.status === 'in_progress' && battle?.startedAt) {
      // Calculate elapsed time since game started
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
      
      // Check if current player has already submitted a result
      const currentPlayer = gameData.players?.find(p => p.user._id === user?.id);
      if (currentPlayer && currentPlayer.result) {
        setHasSubmittedResult(true);
      }
    } catch (error) {
      toast.error('Failed to load battle details');
      navigate('/game-lobby');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      const watermarked = await addTimestampToImage(file);
      setScreenshot(watermarked);
      setScreenshotPreview(URL.createObjectURL(watermarked));
    } catch {
      // fallback to original if canvas fails
      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadWinScreenshot = async () => {
    if (!screenshot) {
      toast.error('Please select a screenshot');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('screenshot', screenshot);
      formData.append('roomCode', roomCode);

      await gameAPI.uploadWinScreenshot(formData);
      
      // Submit won result
      await gameAPI.submitGameResult(roomCode, 'won');
      
      toast.success('Screenshot uploaded and result submitted successfully!');
      setScreenshot(null);
      setScreenshotPreview('');
      setShowUploadDialog(false);
      setHasSubmittedResult(true);
      fetchBattleDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload screenshot');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelBattle = async (reason) => {
    if (!reason || reason.trim() === '') {
      toast.error('Please select a cancel reason');
      return;
    }
    
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
        toast.success(`Battle cancelled! Reason: ${reason}. ₹${response.data.refundedAmount} refunded to your wallet`);
        navigate('/game-lobby');
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
        navigate('/game-lobby');
      } else {
        toast.success('Cancellation request rejected. Game continues.');
        setShowCancelRequestDialog(false);
      }
      
      fetchBattleDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to respond');
    }
  };

  const handleIWon = () => {
    if (!hasSubmittedResult) {
      setShowUploadDialog(true);
    }
  };

  const handleILost = () => {
    if (!hasSubmittedResult) {
      setShowLostConfirm(true);
    }
  };

  const handleSubmitLost = async () => {
    try {
      await gameAPI.submitGameResult(roomCode, 'lost');
      setShowLostConfirm(false);
      setHasSubmittedResult(true);
      toast.success('Game result submitted');
      fetchBattleDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit result');
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e8f5d0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-400"></div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen bg-[#e8f5d0] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-800 text-xl font-bold">Battle not found</p>
          <button
            onClick={() => navigate('/game-lobby')}
            className="mt-4 bg-teal-500 text-white px-6 py-2 rounded-xl font-bold"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  const isPlayer = battle.players?.some(p => p.user._id === user?.id);
  const currentPlayer = battle.players?.find(p => p.user._id === user?.id);
  const hasUploadedScreenshot = currentPlayer?.winScreenshot;
  const isCreator = battle.players?.[0]?.user._id === user?.id;
  
  // Cancel button is always enabled during game (except when result submitted)
  const canCancel = !hasSubmittedResult && battle.status !== 'completed' && battle.status !== 'cancelled';
  
  const player1 = battle.players?.[0];
  const player2 = battle.players?.[1];

  return (
    <div className="min-h-screen bg-[#e8f5d0] p-4 pb-24">
      {/* Player VS Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-2xl p-4 mb-4 shadow-xl border-2 border-gray-300"
      >
        <div className="flex items-center justify-between">
          {/* Player 1 */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-black text-2xl mb-2 shadow-lg">
              {player1?.user?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <p className="text-white font-bold text-sm">{player1?.user?.username || player1?.user?.phoneNumber?.slice(-4) || 'Player 1'}</p>
            <div className="mt-2">
              <p className="text-gray-400 text-xs">Battle Amount</p>
              <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded">
                <span className="text-green-400 text-xs">₹</span>
                <span className="text-green-400 font-bold">{battle.entryFee}</span>
              </div>
            </div>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center">
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
              VS
            </div>
          </div>

          {/* Player 2 */}
          <div className="flex flex-col items-center">
            {player2 ? (
              <>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-black text-2xl mb-2 shadow-lg">
                  {player2?.user?.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <p className="text-white font-bold text-sm">{player2?.user?.username || player2?.user?.phoneNumber?.slice(-4) || 'Player 2'}</p>
                <div className="mt-2">
                  <p className="text-gray-400 text-xs">Prize Amount</p>
                  <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded">
                    <span className="text-green-400 text-xs">₹</span>
                    <span className="text-green-400 font-bold">{battle.prizePool.toFixed(1)}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-gray-500 font-black text-2xl mb-2">
                  ?
                </div>
                <p className="text-gray-500 font-bold text-sm">Waiting...</p>
                <div className="mt-2">
                  <p className="text-gray-400 text-xs">Prize Amount</p>
                  <div className="flex items-center gap-1 bg-gray-700/50 px-2 py-1 rounded">
                    <span className="text-gray-500 text-xs">₹</span>
                    <span className="text-gray-500 font-bold">NaN</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Room Code Input Section */}
      {(battle.status === 'accepted' || battle.status === 'in_progress') && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 mb-4 shadow-xl border-2 border-gray-300 relative"
        >
          {/* Language Toggle */}
          <div className="absolute top-4 right-4 flex bg-gray-100 rounded-lg p-1 border border-gray-200">
             <button
                onClick={() => setInstructLang('en')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${instructLang === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
             >
               English
             </button>
             <button
                onClick={() => setInstructLang('hi')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${instructLang === 'hi' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
             >
               हिन्दी
             </button>
          </div>

          <p className="text-center text-gray-700 text-sm mb-2 font-semibold px-4 pt-6">
            {isCreator 
              ? (instructLang === 'hi' ? 'कृपया लूडो किंग से रूम कोड कॉपी करें और नीचे दर्ज करें' : 'Please copy the room code from Ludo King and enter it below')
              : (instructLang === 'hi' ? 'कृपया लूडो गेम शुरू होने का इंतज़ार करें...' : 'Please wait for the creator to share the Ludo room code...')
            }
          </p>
          <p className="text-center text-yellow-600 font-bold text-lg mb-4">
            Time left:- {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')} Min
          </p>
          
          {isCreator ? (
            // Creator can set room code
            battle.gameRoomCode ? (
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 text-center">
                <p className="text-green-700 font-bold text-lg mb-1">Room Code Set</p>
                <p className="text-green-600 text-2xl font-black">{battle.gameRoomCode}</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter Room Code"
                  className="flex-1 bg-white border-2 border-gray-300 px-4 py-3 rounded-xl text-gray-800 font-bold outline-none focus:border-purple-500 transition-all"
                />
                <button
                  onClick={async () => {
                    if (roomCodeInput.trim()) {
                      try {
                        await gameAPI.setGameRoomCode(roomCode, roomCodeInput);
                        toast.success('Room code set!');
                        fetchBattleDetails();
                      } catch (error) {
                        toast.error(error.response?.data?.message || 'Failed to set room code');
                      }
                    } else {
                      toast.error('Please enter a room code');
                    }
                  }}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
                >
                  SET
                </button>
              </div>
            )
          ) : (
            // Second player can only view room code
            battle.gameRoomCode ? (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 text-center">
                <p className="text-blue-700 font-bold text-lg mb-1">Room Code</p>
                <p className="text-blue-600 text-2xl font-black">{battle.gameRoomCode}</p>
              </div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 text-center">
                <p className="text-yellow-700 font-bold">Waiting for creator to set room code...</p>
              </div>
            )
          )}
        </motion.div>
      )}

      {/* Update Game Status Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 mb-4 shadow-xl border-2 border-gray-300"
      >
        <h2 className="text-yellow-600 font-bold text-xl mb-2 text-center">Update Game Status</h2>
        
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
            <p className="text-blue-600 text-sm">Waiting for opponent to submit their result...</p>
          </div>
        ) : (
          <p className="text-gray-700 text-sm text-center mb-4">
            After completion of your game, select the status of the game and post your screenshot below.
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleIWon}
            disabled={!isPlayer || battle.status !== 'in_progress' || hasSubmittedResult}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            I Won
          </button>
          <button
            onClick={handleILost}
            disabled={!isPlayer || battle.status !== 'in_progress' || hasSubmittedResult}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            I Lost
          </button>
          <button
            onClick={() => setShowCancelReasons(true)}
            disabled={!canCancel}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            Cancel
          </button>
        </div>
      </motion.div>

      {/* Cancel Reasons Dialog */}
      {showCancelReasons && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-black text-gray-800 mb-2 text-center">
              Why do you want to cancel?
            </h2>
            <p className="text-gray-600 text-sm text-center mb-4">
              Select a reason to cancel this battle
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Late Start', icon: '⏰' },
                { label: 'No Room Code', icon: '🔢' },
                { label: 'Opponent Not Joined', icon: '👤' },
                { label: 'Changed My Mind', icon: '🤔' },
                { label: 'Technical Issue', icon: '⚠️' },
                { label: 'Wrong Amount', icon: '💰' },
                { label: 'Opponent Not Playing', icon: '🎮' },
                { label: 'Other Reason', icon: '📝' }
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleCancelBattle(item.label)}
                  className="bg-gradient-to-br from-gray-700 to-gray-800 hover:from-red-500 hover:to-red-600 text-white py-3 px-3 rounded-xl font-semibold transition-all text-sm flex flex-col items-center gap-1 shadow-lg"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs leading-tight">{item.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCancelReasons(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}

      {/* Upload Screenshot Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-black text-gray-800 mb-4 text-center text-purple-600">
              Upload Result Screenshot
            </h2>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {screenshotPreview ? (
              <div className="mb-4">
                <img
                  src={screenshotPreview}
                  alt="Preview"
                  className="w-full h-64 object-contain rounded-xl border-2 border-gray-300 bg-gray-50"
                />
                <button
                  onClick={() => {
                    setScreenshot(null);
                    setScreenshotPreview('');
                  }}
                  className="w-full mt-3 bg-red-100 text-red-600 py-2 rounded-xl font-bold hover:bg-red-200 transition-all"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-4 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-purple-500 hover:bg-purple-50 transition-all mb-4"
              >
                <FaUpload className="text-5xl text-gray-400" />
                <p className="text-gray-600 font-bold">Click and upload screenshot</p>
              </button>
            )}

            <button
              onClick={handleUploadWinScreenshot}
              disabled={!screenshot || uploading}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mb-3"
            >
              {uploading ? 'Uploading...' : 'Submit'}
            </button>

            <button
              onClick={() => {
                setShowUploadDialog(false);
                setScreenshot(null);
                setScreenshotPreview('');
              }}
              className="w-full bg-gray-200 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}

      {/* Lost Confirmation Dialog */}
      {showLostConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-xl font-black text-gray-800 mb-6 text-center">
              Are you sure you Lost this game?
            </h2>

            <div className="flex gap-3">
              <button
                onClick={handleSubmitLost}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
              >
                Yes, I Lost
              </button>
              <button
                onClick={() => setShowLostConfirm(false)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
              >
                No
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
    </div>
  );
};

export default BattleRoom;