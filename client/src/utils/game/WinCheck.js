const WinCheck = (color, newPosition) => {
  // Map colors to their win track positions
  const colorWinTracks = {
    'red': 100,
    'yellow': 200,
    'green': 300,
    'blue': 400
  };

  const winTrack = colorWinTracks[color];
  
  if (newPosition > winTrack + 6) {
    return false;
  }
  return true;
};

export default WinCheck;
