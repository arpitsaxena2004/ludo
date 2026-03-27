import Game from '../models/Game.js';
import User from '../models/User.js';

/**
 * Auto-expires waiting games where only 1 player has joined
 * and no second player joined within the configured timeout.
 * Refunds the creator's entry fee automatically.
 *
 * Runs every 30 seconds via setInterval in server.js
 */
export const autoExpireWaitingGames = async () => {
  try {
    const EXPIRE_AFTER_MS = 1 * 60 * 1000; // 1 minute
    const cutoffTime = new Date(Date.now() - EXPIRE_AFTER_MS);

    // Find games that are still 'waiting' with only 1 player and created before the cutoff
    const expiredGames = await Game.find({
      status: 'waiting',
      currentPlayers: 1,
      createdAt: { $lt: cutoffTime }
    });

    if (expiredGames.length === 0) return;

    console.log(`[AutoExpire] Found ${expiredGames.length} game(s) to expire.`);

    const Transaction = (await import('../models/Transaction.js')).default;

    for (const game of expiredGames) {
      try {
        // Mark as cancelled first to prevent race conditions
        game.status = 'cancelled';
        await game.save();

        // Refund entry fee to creator (first player)
        const creatorId = game.players[0]?.user;
        if (creatorId) {
          await User.findByIdAndUpdate(creatorId, {
            $inc: { depositCash: game.entryFee }
          });

          await Transaction.create({
            user: creatorId,
            type: 'refund',
            amount: game.entryFee,
            status: 'completed',
            description: `Auto-refund: Battle ${game.roomCode} expired (no opponent joined within 1 minute)`,
            metadata: {
              gameId: game._id,
              roomCode: game.roomCode
            }
          });

          console.log(`[AutoExpire] Cancelled ${game.roomCode}, refunded ₹${game.entryFee} to creator ${creatorId}`);
        }
      } catch (gameErr) {
        console.error(`[AutoExpire] Failed to expire game ${game.roomCode}:`, gameErr.message);
      }
    }
  } catch (err) {
    console.error('[AutoExpire] Error running auto-expire job:', err.message);
  }
};
