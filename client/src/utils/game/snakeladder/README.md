# Snake and Ladder Game Logic

Complete implementation of Snake and Ladder game logic for React applications.

## Features

- ✅ 10x10 board (100 squares)
- ✅ Multiple snakes and ladders
- ✅ 2-4 player support
- ✅ Dice rolling with animations
- ✅ Win detection
- ✅ Game state management
- ✅ Configurable rules (exact win, 6 to start, etc.)

## File Structure

```
snakeladder/
├── BoardLayout.js      - Board structure, snakes, ladders positions
├── DiceRoll.js         - Dice rolling logic and animations
├── PlayerMove.js       - Player movement and path calculation
├── GameRules.js        - Game rules and turn processing
├── WinCheck.js         - Win conditions and game statistics
└── index.js            - Main exports
```

## Quick Start

### 1. Basic Usage

```javascript
import { initializeGame, processTurn, rollDice } from './utils/game/snakeladder';

// Initialize game with 2 players
const gameState = initializeGame(2);

// Roll dice and process turn
const diceValue = rollDice();
const newState = processTurn(gameState, diceValue);
```

### 2. With React Context (Recommended)

```javascript
import { SnakeLadderProvider, useSnakeLadder } from './context/SnakeLadderContext';

function App() {
  return (
    <SnakeLadderProvider>
      <SnakeLadderGame />
    </SnakeLadderProvider>
  );
}

function SnakeLadderGame() {
  const { startGame, handleRollDice, gameState } = useSnakeLadder();
  
  return (
    <div>
      <button onClick={() => startGame(2)}>Start Game</button>
      <button onClick={handleRollDice}>Roll Dice</button>
    </div>
  );
}
```

## Board Layout

### Snakes (Head → Tail)
- 99 → 54
- 95 → 72
- 92 → 88
- 89 → 68
- 87 → 24
- 83 → 19
- 73 → 53
- 69 → 33
- 64 → 60
- 62 → 19
- 51 → 34
- 49 → 11
- 47 → 26
- 37 → 3
- 17 → 7

### Ladders (Bottom → Top)
- 2 → 38
- 4 → 14
- 9 → 31
- 21 → 42
- 28 → 84
- 36 → 44
- 51 → 67
- 71 → 91
- 80 → 100

## Game Configuration

```javascript
export const GAME_CONFIG = {
  minPlayers: 2,
  maxPlayers: 4,
  requireSixToStart: false,        // Need 6 to start moving
  threeConsecutiveSixesRule: false, // 3 sixes = back to start
  exactNumberToWin: true            // Must land exactly on 100
};
```

## API Reference

### BoardLayout.js

```javascript
// Constants
BOARD_SIZE = 10
TOTAL_SQUARES = 100
WINNING_POSITION = 100
SNAKES = { ... }
LADDERS = { ... }

// Functions
getPositionCoordinates(position) // Get row/col for rendering
hasSnake(position)               // Check if position has snake
hasLadder(position)              // Check if position has ladder
getFinalPosition(position)       // Get position after snake/ladder
isValidMove(currentPos, dice)    // Check if move is valid
getAllSnakes()                   // Get all snake positions
getAllLadders()                  // Get all ladder positions
```

### DiceRoll.js

```javascript
rollDice()                              // Roll 1-6
getAnotherTurn(diceValue)              // Check if rolled 6
handleConsecutiveSixes(count, dice)    // Track consecutive 6s
shouldResetPosition(consecutiveSixes)  // Check for 3 sixes rule
animateDiceRoll(callback, duration)    // Animate dice roll
```

### PlayerMove.js

```javascript
movePlayer(currentPos, diceValue)      // Move player and handle snake/ladder
canStart(currentPos, needSix, dice)    // Check if player can start
getMovementPath(startPos, diceValue)   // Get path for animation
getFullMovementPath(startPos, dice)    // Get path including snake/ladder
```

### GameRules.js

```javascript
initializeGame(playerCount)            // Create new game
processTurn(gameState, diceValue)      // Process a turn
isGameOver(gameState)                  // Check if game finished
getCurrentPlayer(gameState)            // Get current player
getPlayerRankings(gameState)           // Get player rankings
validateGameState(gameState)           // Validate game state
```

### WinCheck.js

```javascript
checkWin(position, diceValue)          // Check if player won
wouldWin(currentPos, diceValue)        // Check if move would win
stepsToWin(currentPosition)            // Calculate steps to win
isCloseToWin(position)                 // Check if within 6 steps
getWinMessage(playerName, color)       // Get random win message
calculateGameStats(gameState)          // Get game statistics
getNearWinStatus(position)             // Get near-win status
```

## Game State Structure

```javascript
{
  players: [
    {
      id: 1,
      position: 0,
      color: 'red',
      consecutiveSixes: 0,
      isWinner: false
    },
    // ... more players
  ],
  currentPlayerIndex: 0,
  gameStatus: 'playing',  // 'waiting', 'playing', 'finished'
  winner: null,
  lastDiceRoll: null,
  turnCount: 0
}
```

## Move Result Structure

```javascript
{
  newPosition: 45,
  intermediatePosition: 40,
  moved: true,
  event: 'ladder',  // 'normal', 'snake', 'ladder'
  message: 'Climbed ladder! From 40 to 45',
  won: false
}
```

## Integration with Backend

### Server-side Game Model

Add to `server/models/Game.js`:

```javascript
gameType: {
  type: String,
  enum: ['ludo', 'snakeladder'],
  default: 'ludo'
},
snakeLadderState: {
  players: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    position: { type: Number, default: 0 },
    consecutiveSixes: { type: Number, default: 0 },
    isWinner: { type: Boolean, default: false }
  }],
  currentPlayerIndex: { type: Number, default: 0 },
  turnCount: { type: Number, default: 0 }
}
```

### Socket.io Events

```javascript
// Client emits
socket.emit('snakeladder:roll', { roomCode, diceValue });
socket.emit('snakeladder:move', { roomCode, playerId, newPosition });

// Server emits
socket.on('snakeladder:update', (gameState) => { ... });
socket.on('snakeladder:winner', (winnerId) => { ... });
```

## Testing

```javascript
import { initializeGame, processTurn, rollDice } from './snakeladder';

// Test game flow
const game = initializeGame(2);
console.log('Initial state:', game);

// Simulate turns
for (let i = 0; i < 10; i++) {
  const dice = rollDice();
  const newState = processTurn(game, dice);
  console.log(`Turn ${i + 1}: Rolled ${dice}`, newState);
  
  if (newState.gameStatus === 'finished') {
    console.log('Game Over! Winner:', newState.winner);
    break;
  }
}
```

## Customization

### Add More Snakes/Ladders

Edit `BoardLayout.js`:

```javascript
export const SNAKES = {
  99: 54,
  // Add more snakes
  85: 30,
  // ...
};

export const LADDERS = {
  2: 38,
  // Add more ladders
  15: 45,
  // ...
};
```

### Change Game Rules

Edit `GameRules.js`:

```javascript
export const GAME_CONFIG = {
  minPlayers: 2,
  maxPlayers: 6,              // Allow 6 players
  requireSixToStart: true,    // Need 6 to start
  threeConsecutiveSixesRule: true,  // Enable 3 sixes rule
  exactNumberToWin: false     // Can exceed 100
};
```

## Performance Tips

1. Use React.memo for board squares
2. Debounce dice rolls
3. Use CSS transforms for animations
4. Lazy load game assets
5. Optimize re-renders with useMemo/useCallback

## License

MIT
