import { WINNING_POSITION } from './BoardLayout';
import { getAnotherTurn, shouldResetPosition } from './DiceRoll';
import { movePlayer, canStart } from './PlayerMove';

// Game configuration
export const GAME_CONFIG = {
  minPlayers: 2,
  maxPlayers: 4,
  requireSixToStart: false, // Set to true if players need 6 to start
  threeConsecutiveSixesRule: false, // Set to true to reset on 3 sixes
  exactNumberToWin: true // Must land exactly on 100
};

// Initialize game state
export const initializeGame = (playerCount = 2) => {
  const players = [];
  const colors = ['red', 'blue', 'green', 'yellow'];
  
  for (let i = 0; i < playerCount; i++) {
    players.push({
      id: i + 1,
      position: 0,
      color: colors[i],
      consecutiveSixes: 0,
      isWinner: false
    });
  }
  
  return {
    players,
    currentPlayerIndex: 0,
    gameStatus: 'waiting', // waiting, playing, finished
    winner: null,
    lastDiceRoll: null
  };
};

// Process a turn
export const processTurn = (gameState, diceValue) => {
  const newState = { ...gameState };
  const currentPlayer = newState.players[newState.currentPlayerIndex];
  
  // Check if player can start
  if (!canStart(currentPlayer.position, GAME_CONFIG.requireSixToStart, diceValue)) {
    return {
      ...newState,
      lastDiceRoll: diceValue,
      message: 'Need a 6 to start!',
      currentPlayerIndex: getNextPlayerIndex(newState)
    };
  }
  
  // Handle consecutive sixes
  if (diceValue === 6) {
    currentPlayer.consecutiveSixes += 1;
  } else {
    currentPlayer.consecutiveSixes = 0;
  }
  
  // Check for 3 consecutive sixes rule
  if (GAME_CONFIG.threeConsecutiveSixesRule && shouldResetPosition(currentPlayer.consecutiveSixes)) {
    currentPlayer.position = 0;
    currentPlayer.consecutiveSixes = 0;
    return {
      ...newState,
      lastDiceRoll: diceValue,
      message: '3 sixes in a row! Back to start!',
      currentPlayerIndex: getNextPlayerIndex(newState)
    };
  }
  
  // Move player
  const moveResult = movePlayer(currentPlayer.position, diceValue);
  
  if (moveResult.moved) {
    currentPlayer.position = moveResult.newPosition;
    
    // Check for win
    if (moveResult.won) {
      currentPlayer.isWinner = true;
      newState.gameStatus = 'finished';
      newState.winner = currentPlayer.id;
    }
  }
  
  // Determine next player (if rolled 6, same player goes again)
  const shouldContinue = getAnotherTurn(diceValue) && !moveResult.won;
  
  return {
    ...newState,
    lastDiceRoll: diceValue,
    message: moveResult.message,
    moveResult,
    currentPlayerIndex: shouldContinue ? newState.currentPlayerIndex : getNextPlayerIndex(newState)
  };
};

// Get next player index
const getNextPlayerIndex = (gameState) => {
  const activePlayers = gameState.players.filter(p => !p.isWinner);
  if (activePlayers.length <= 1) return gameState.currentPlayerIndex;
  
  let nextIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  
  // Skip winners
  while (gameState.players[nextIndex].isWinner) {
    nextIndex = (nextIndex + 1) % gameState.players.length;
  }
  
  return nextIndex;
};

// Check if game is over
export const isGameOver = (gameState) => {
  return gameState.gameStatus === 'finished';
};

// Get current player
export const getCurrentPlayer = (gameState) => {
  return gameState.players[gameState.currentPlayerIndex];
};

// Get player rankings
export const getPlayerRankings = (gameState) => {
  return [...gameState.players].sort((a, b) => {
    if (a.isWinner && !b.isWinner) return -1;
    if (!a.isWinner && b.isWinner) return 1;
    return b.position - a.position;
  });
};

// Validate game state
export const validateGameState = (gameState) => {
  const errors = [];
  
  if (gameState.players.length < GAME_CONFIG.minPlayers) {
    errors.push(`Minimum ${GAME_CONFIG.minPlayers} players required`);
  }
  
  if (gameState.players.length > GAME_CONFIG.maxPlayers) {
    errors.push(`Maximum ${GAME_CONFIG.maxPlayers} players allowed`);
  }
  
  gameState.players.forEach((player, index) => {
    if (player.position < 0 || player.position > WINNING_POSITION) {
      errors.push(`Player ${index + 1} has invalid position: ${player.position}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
