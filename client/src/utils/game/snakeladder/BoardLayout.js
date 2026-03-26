// Snake and Ladder Board Layout (10x10 = 100 squares)
// Board numbering: Bottom-left is 1, top-right is 100
// Odd rows go left-to-right, even rows go right-to-left (serpentine pattern)

export const BOARD_SIZE = 10;
export const TOTAL_SQUARES = 100;
export const WINNING_POSITION = 100;

// Snakes: head position -> tail position
export const SNAKES = {
  99: 54,
  95: 72,
  92: 88,
  89: 68,
  87: 24,
  83: 19,
  73: 53,
  69: 33,
  64: 60,
  62: 19,
  51: 34,
  49: 11,
  47: 26,
  37: 3,
  17: 7
};

// Ladders: bottom position -> top position
export const LADDERS = {
  2: 38,
  4: 14,
  9: 31,
  21: 42,
  28: 84,
  36: 44,
  51: 67,
  71: 91,
  80: 100
};

// Get position coordinates on the board (for rendering)
export const getPositionCoordinates = (position) => {
  if (position < 1 || position > 100) return { row: 0, col: 0 };
  
  const adjustedPos = position - 1;
  const row = Math.floor(adjustedPos / BOARD_SIZE);
  const col = adjustedPos % BOARD_SIZE;
  
  // Serpentine pattern: even rows go right-to-left
  const actualCol = row % 2 === 0 ? col : (BOARD_SIZE - 1 - col);
  
  return {
    row: BOARD_SIZE - 1 - row, // Flip vertically (bottom to top)
    col: actualCol
  };
};

// Check if position has a snake
export const hasSnake = (position) => {
  return SNAKES.hasOwnProperty(position);
};

// Check if position has a ladder
export const hasLadder = (position) => {
  return LADDERS.hasOwnProperty(position);
};

// Get final position after snake/ladder
export const getFinalPosition = (position) => {
  if (hasSnake(position)) {
    return SNAKES[position];
  }
  if (hasLadder(position)) {
    return LADDERS[position];
  }
  return position;
};

// Check if move is valid
export const isValidMove = (currentPosition, diceValue) => {
  const newPosition = currentPosition + diceValue;
  return newPosition <= WINNING_POSITION;
};

// Get all snake positions for rendering
export const getAllSnakes = () => {
  return Object.entries(SNAKES).map(([head, tail]) => ({
    head: parseInt(head),
    tail: parseInt(tail)
  }));
};

// Get all ladder positions for rendering
export const getAllLadders = () => {
  return Object.entries(LADDERS).map(([bottom, top]) => ({
    bottom: parseInt(bottom),
    top: parseInt(top)
  }));
};
