import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUpload } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { gameAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const BattleRoom = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
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
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchBattleDetails();
    const interval = setInterval(fetchBattleDetails, 3000);
    return () => clearInterval(interval);
  }, [roomCode]);

  // Timer countdown
  useEffect(() => {
    if (battle?.status === 'in_progress' && battle?.startedAt) {
      // Calculate elapsed time since game started
      const startTime = new Date(battle.startedAt).getTime();
      const currentTime = new Date().getTime();
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
      const remainingTime = Math.max(0, 300 - elapsedSeconds); // 5 minutes = 300 seconds
      
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

  const handleFileChange = (e) => {
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

    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
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
    setShowCancelReasons(false);
    
    try {
      const response = await gameAPI.cancelGame(roomCode);
      toast.success(`Battle cancelled! ₹${response.data.refundedAmount} refunded to your wallet`);
      navigate('/game-lobby');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel battle');
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
  const canCancel = battle.currentPlayers < 2 || battle.status === 'waiting';
  
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
          className="bg-white rounded-2xl p-6 mb-4 shadow-xl border-2 border-gray-300"
        >
          <p className="text-center text-gray-700 text-sm mb-2 font-semibold">
            कृपया लूडो किंग से कोड अपलोड करें
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
            <p className="text-green-600 text-sm">Both players have submitted their results. Admin will review and declare the winner.</p>
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
            disabled={!canCancel || battle.gameRoomCode || hasSubmittedResult}
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
            <h2 className="text-2xl font-black text-gray-800 mb-4 text-center">
              Select Cancel Reason
            </h2>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                'No Room code',
                'Not Joined',
                'Not Playing',
                "Don't want to play",
                'Opponent Abusing',
                'Game not started'
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleCancelBattle(reason)}
                  className="bg-gray-700 text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-600 transition-all text-sm"
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelReasons(false)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowCancelReasons(false);
                  handleCancelBattle('Other');
                }}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
              >
                Submit
              </button>
            </div>
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
    </div>
  );
};

export default BattleRoom;