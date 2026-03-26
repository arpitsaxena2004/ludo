import { WINNING_POSITION } from './BoardLayout';
import { GAME_CONFIG } from './GameRules';

// Check if player has won
export const checkWin = (position, diceValue) => {
  const newPosition = position + diceValue;
  
  if (GAME_CONFIG.exactNumberToWin) {
    // Must land exactly on 100
    return newPosition === WINNING_POSITION;
  } else {
    // Can exceed 100 to win
    return newPosition >= WINNING_POSITION;
  }
};

// Check if move would win the game
export const wouldWin = (currentPosition, diceValue) => {
  return checkWin(currentPosition, diceValue);
};

// Calculate how many steps needed to win
export const stepsToWin = (currentPosition) => {
  return WINNING_POSITION - currentPosition;
};

// Check if player is close to winning (within 6 steps)
export const isCloseToWin = (position) => {
  return stepsToWin(position) <= 6;
};

// Get winning message
export const getWinMessage = (playerName, playerColor) => {
  const messages = [
    `🎉 ${playerName} wins! Congratulations!`,
    `🏆 Victory! ${playerName} reached 100!`,
    `👑 ${playerName} is the champion!`,
    `🎊 ${playerName} climbed to victory!`,
    `⭐ Amazing! ${playerName} won the game!`
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
};

// Calculate game statistics
export const calculateGameStats = (gameState) => {
  const winner = gameState.players.find(p => p.isWinner);
  const totalTurns = gameState.turnCount || 0;
  
  return {
    winner: winner ? winner.id : null,
    winnerColor: winner ? winner.color : null,
    totalTurns,
    averageTurnsPerPlayer: totalTurns / gameState.players.length,
    rankings: gameState.players
      .map(p => ({
        id: p.id,
        color: p.color,
        position: p.position,
        isWinner: p.isWinner
      }))
      .sort((a, b) => {
        if (a.isWinner && !b.isWinner) return -1;
        if (!a.isWinner && b.isWinner) return 1;
        return b.position - a.position;
      })
  };
};

// Check for near-win situations (for UI feedback)
export const getNearWinStatus = (position) => {
  const steps = stepsToWin(position);
  
  if (steps === 0) return { status: 'won', message: 'Winner!' };
  if (steps <= 3) return { status: 'very_close', message: `Only ${steps} steps to win!` };
  if (steps <= 6) return { status: 'close', message: `${steps} steps to victory!` };
  
  return { status: 'normal', message: '' };
};
