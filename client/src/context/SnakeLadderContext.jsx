import { createContext, useContext, useState, useCallback } from 'react';
import {
  initializeGame,
  processTurn,
  rollDice,
  getCurrentPlayer,
  isGameOver,
  getPlayerRankings,
  SNAKES,
  LADDERS,
  WINNING_POSITION
} from '../utils/game/snakeladder';

const SnakeLadderContext = createContext();

export const useSnakeLadder = () => {
  const context = useContext(SnakeLadderContext);
  if (!context) {
    throw new Error('useSnakeLadder must be used within SnakeLadderProvider');
  }
  return context;
};

export const SnakeLadderProvider = ({ children }) => {
  const [gameState, setGameState] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [lastMoveResult, setLastMoveResult] = useState(null);

  // Start new game
  const startGame = useCallback((playerCount = 2) => {
    const newGame = initializeGame(playerCount);
    newGame.gameStatus = 'playing';
    newGame.turnCount = 0;
    setGameState(newGame);
    setLastMoveResult(null);
  }, []);

  // Roll dice and process turn
  const handleRollDice = useCallback(() => {
    if (!gameState || isRolling || isGameOver(gameState)) return;

    setIsRolling(true);

    // Simulate dice roll animation
    setTimeout(() => {
      const diceValue = rollDice();
      const newState = processTurn(gameState, diceValue);
      newState.turnCount = (gameState.turnCount || 0) + 1;
      
      setGameState(newState);
      setLastMoveResult(newState.moveResult);
      setIsRolling(false);
    }, 500);
  }, [gameState, isRolling]);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState(null);
    setLastMoveResult(null);
    setIsRolling(false);
  }, []);

  // Get current game info
  const getCurrentGameInfo = useCallback(() => {
    if (!gameState) return null;

    return {
      currentPlayer: getCurrentPlayer(gameState),
      isGameOver: isGameOver(gameState),
      rankings: getPlayerRankings(gameState),
      turnCount: gameState.turnCount || 0,
      lastDiceRoll: gameState.lastDiceRoll,
      winner: gameState.winner
    };
  }, [gameState]);

  const value = {
    gameState,
    isRolling,
    lastMoveResult,
    startGame,
    handleRollDice,
    resetGame,
    getCurrentGameInfo,
    // Constants
    SNAKES,
    LADDERS,
    WINNING_POSITION
  };

  return (
    <SnakeLadderContext.Provider value={value}>
      {children}
    </SnakeLadderContext.Provider>
  );
};

export default SnakeLadderContext;
