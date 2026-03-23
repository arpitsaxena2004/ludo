const DiceRolled = (diceNumberValue, nextTurn, currentPlayer, playerPositions, setDiceDisabled) => {
  const diceNumber = diceNumberValue.current;

  const checkAllPositions = (positions, value) => {
    return positions.every((position) => position === value);
  };

  if (diceNumber === 6 && playerPositions[currentPlayer].every(position => position > 100)) {
    setTimeout(() => {
      diceNumberValue.current = 0;
      nextTurn();
      setDiceDisabled(false);
    }, 1500);
  }

  const checkAllPossibilities = (diceNumber, currentPlayer, diceNumberValue, nextTurn, setDiceDisabled) => {
    if (diceNumber !== 0) {
      const allPlayers = ["red", "green"]; // Only 2 active players
      const winTrack = 100 * (allPlayers.indexOf(currentPlayer) + 1);
      // Adjust for green being position 3 in original array
      const actualWinTrack = currentPlayer === 'green' ? 300 : 100;
      let isTurn = true;
      if (diceNumber === 6) {
        isTurn = false;
      }
      for (let position of playerPositions[currentPlayer]) {
        if (position < actualWinTrack && position !== 0) {
          isTurn = false;
          break;
        } else if (position > actualWinTrack && position < actualWinTrack + 6 && position + diceNumber <= actualWinTrack + 6) {
          isTurn = false;
          break;
        }
      }
      if (isTurn) {
        setTimeout(() => {
          diceNumberValue.current = 0;
          nextTurn();
          setDiceDisabled(false);
        }, 1500);
      }
    }
  };

  checkAllPossibilities(diceNumber, currentPlayer, diceNumberValue, nextTurn, setDiceDisabled);

  // Check win conditions for 2 players only
  if (currentPlayer === "red") {
    if (checkAllPositions(playerPositions["red"], 106)) {
      nextTurn();
    }
  } else if (currentPlayer === "green") {
    if (checkAllPositions(playerPositions["green"], 306)) {
      nextTurn();
    }
  }
};

export default DiceRolled;
