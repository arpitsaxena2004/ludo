// Dice rolling logic for Snake and Ladder

export const rollDice = () => {
  return Math.floor(Math.random() * 6) + 1;
};

// Check if player gets another turn (rolled a 6)
export const getAnotherTurn = (diceValue) => {
  return diceValue === 6;
};

// Track consecutive sixes (some variants: 3 sixes = back to start)
export const handleConsecutiveSixes = (consecutiveSixes, diceValue) => {
  if (diceValue === 6) {
    return consecutiveSixes + 1;
  }
  return 0;
};

// Some game variants: 3 consecutive sixes sends player back to start
export const shouldResetPosition = (consecutiveSixes) => {
  return consecutiveSixes >= 3;
};

// Animate dice roll
export const animateDiceRoll = (callback, duration = 500) => {
  const startTime = Date.now();
  const interval = 50;
  
  const animate = setInterval(() => {
    const elapsed = Date.now() - startTime;
    
    if (elapsed >= duration) {
      clearInterval(animate);
      const finalValue = rollDice();
      callback(finalValue);
    } else {
      // Show random values during animation
      callback(Math.floor(Math.random() * 6) + 1);
    }
  }, interval);
  
  return interval;
};
