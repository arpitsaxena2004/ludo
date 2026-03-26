import { 
  WINNING_POSITION, 
  getFinalPosition, 
  isValidMove,
  hasSnake,
  hasLadder 
} from './BoardLayout';

// Move player based on dice roll
export const movePlayer = (currentPosition, diceValue) => {
  // Check if move is valid (doesn't exceed 100)
  if (!isValidMove(currentPosition, diceValue)) {
    return {
      newPosition: currentPosition,
      moved: false,
      reason: 'exceeds_board',
      message: 'Exact number needed to win!'
    };
  }
  
  // Calculate new position
  const intermediatePosition = currentPosition + diceValue;
  
  // Check for snake or ladder
  const finalPosition = getFinalPosition(intermediatePosition);
  
  // Determine what happened
  let event = 'normal';
  let message = `Moved ${diceValue} steps`;
  
  if (hasSnake(intermediatePosition)) {
    event = 'snake';
    message = `Snake bite! Slid down from ${intermediatePosition} to ${finalPosition}`;
  } else if (hasLadder(intermediatePosition)) {
    event = 'ladder';
    message = `Climbed ladder! From ${intermediatePosition} to ${finalPosition}`;
  }
  
  return {
    newPosition: finalPosition,
    intermediatePosition,
    moved: true,
    event,
    message,
    won: finalPosition === WINNING_POSITION
  };
};

// Check if player can start (needs to roll specific number in some variants)
export const canStart = (currentPosition, requireSixToStart = false, diceValue) => {
  if (currentPosition > 0) return true;
  if (!requireSixToStart) return true;
  return diceValue === 6;
};

// Get player movement path (for animation)
export const getMovementPath = (startPosition, diceValue) => {
  const path = [];
  const endPosition = Math.min(startPosition + diceValue, WINNING_POSITION);
  
  for (let i = startPosition + 1; i <= endPosition; i++) {
    path.push(i);
  }
  
  return path;
};

// Calculate movement with snake/ladder animation path
export const getFullMovementPath = (startPosition, diceValue) => {
  const normalPath = getMovementPath(startPosition, diceValue);
  const intermediatePosition = startPosition + diceValue;
  
  if (intermediatePosition > WINNING_POSITION) {
    return { normalPath: [], snakeLadderPath: [] };
  }
  
  const finalPosition = getFinalPosition(intermediatePosition);
  const snakeLadderPath = [];
  
  // If there's a snake or ladder, add that movement
  if (finalPosition !== intermediatePosition) {
    snakeLadderPath.push(finalPosition);
  }
  
  return {
    normalPath,
    snakeLadderPath,
    hasSnakeLadder: finalPosition !== intermediatePosition
  };
};
