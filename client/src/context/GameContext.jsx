import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import socketService from '../services/socket';
import useAuthStore from '../store/authStore';

const GameContext = createContext();

export const useGameContext = () => useContext(GameContext);

export const GameProvider = ({ children, roomCode }) => {
  const { user } = useAuthStore();
  const diceNumberValue = useRef(0);
  const defaultBoardSize = useRef(0.8);
  const [diceDisabled, setDiceDisabled] = useState(true);
  const [currentPlayer, setCurrentPlayer] = useState('red');
  const [myColor, setMyColor] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [players, setPlayers] = useState([]);
  const [playerPositions, setPlayerPositions] = useState({
    red: [0, 0, 0, 0],
    green: [0, 0, 0, 0],
    blue: [0, 0, 0, 0],
    yellow: [0, 0, 0, 0]
  });
  const [size, setSize] = useState({
    dice: 1.2,
    board: ''
  });
  const [win, setWin] = useState([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState(null);

  const getMyUserId = () => {
    return user?._id?.toString?.() || user?._id || user?.id?.toString?.() || user?.id || '';
  };

  useEffect(() => {
    function handleResize() {
      const screenWidth = window.innerWidth;
      let newBoardSize = 0.8;

      if (screenWidth < 1025 && screenWidth >= 768) {
        newBoardSize = 0.8;
        defaultBoardSize.current = 0.8;
      } else if (screenWidth < 768 && screenWidth >= 550) {
        newBoardSize = 0.5;
        defaultBoardSize.current = 0.5;
      } else if (screenWidth < 768) {
        newBoardSize = 0.35;
        defaultBoardSize.current = 0.35;
      }

      setSize(prevSize => ({ ...prevSize, board: newBoardSize }));
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!roomCode || !user) return;

    const myUserId = getMyUserId();

    socketService.connectToGame();

    socketService.onGameJoined((data) => {
      const { game, yourColor } = data;
      
      setMyColor(yourColor);
      setPlayers(game.players);
      setGameStatus(game.status);
      
      const turnIndex = game.currentTurn || 0;
      const currentTurnPlayer = game.players[turnIndex];
      const currentTurnColor = currentTurnPlayer?.color || 'red';
      setCurrentPlayer(currentTurnColor);
      
      const isMyTurnNow = game.status === 'in_progress' && currentTurnColor === yourColor;
      setIsMyTurn(isMyTurnNow);
      setDiceDisabled(!isMyTurnNow);

      const positions = { red: [0, 0, 0, 0], green: [0, 0, 0, 0], blue: [0, 0, 0, 0], yellow: [0, 0, 0, 0] };
      game.players.forEach(player => {
        if (player.tokens) {
          positions[player.color] = player.tokens.map(t => {
            const pos = t.position;
            return (pos === -1 || pos === undefined || pos === null) ? 0 : pos;
          });
        }
      });
      setPlayerPositions(positions);
    });

    socketService.onPlayerJoined((data) => {
      setPlayers(prev => {
        const exists = prev.find(p => p.id === data.player.id);
        if (exists) return prev;
        return [...prev, data.player];
      });
    });

    socketService.onGameStarted((data) => {
      setGameStatus('in_progress');
      
      const turnIndex = data.currentTurn || 0;
      
      if (data.players && data.players.length > 0) {
        setPlayers(data.players);
        
        const currentTurnPlayer = data.players[turnIndex];
        const currentTurnColor = currentTurnPlayer?.color || 'red';
        setCurrentPlayer(currentTurnColor);
        
        setMyColor(prevMyColor => {
          const isMyTurnNow = currentTurnColor === prevMyColor;
          setIsMyTurn(isMyTurnNow);
          setDiceDisabled(!isMyTurnNow);
          return prevMyColor;
        });
      }
    });

    socketService.onDiceRolled((data) => {
      const { diceValue, currentTurn } = data;
      diceNumberValue.current = diceValue;
      
      setPlayers(prev => {
        const currentTurnPlayer = prev[currentTurn];
        if (currentTurnPlayer) {
          setCurrentPlayer(currentTurnPlayer.color);
        }
        return prev;
      });
    });

    socketService.onTokenMoved((data) => {
      const { playerId, tokenId, toPosition, currentTurn } = data;
      
      const clientPosition = toPosition === -1 ? 0 : toPosition;
      
      setPlayers(prev => {
        const player = prev.find(p => p.id === playerId);
        if (player) {
          setPlayerPositions(positions => ({
            ...positions,
            [player.color]: positions[player.color].map((pos, idx) => 
              idx === tokenId ? clientPosition : pos
            )
          }));
        }
        
        const nextTurnPlayer = prev[currentTurn];
        const nextTurnColor = nextTurnPlayer?.color || 'red';
        setCurrentPlayer(nextTurnColor);
        
        setMyColor(prevMyColor => {
          const isMyTurnNow = nextTurnColor === prevMyColor;
          setIsMyTurn(isMyTurnNow);
          setDiceDisabled(!isMyTurnNow);
          return prevMyColor;
        });
        
        return prev;
      });
      
      diceNumberValue.current = 0;
    });

    socketService.onGameEnded((data) => {
      setGameEnded(true);
      setWinner(data.winner);
      setGameStatus('completed');
      setDiceDisabled(true);
    });

    socketService.onPlayerLeft(() => {});

    socketService.on('turn_passed', (data) => {
      const { currentTurn } = data;
      
      setPlayers(prev => {
        const nextTurnPlayer = prev[currentTurn];
        const nextTurnColor = nextTurnPlayer?.color || 'red';
        setCurrentPlayer(nextTurnColor);
        
        setMyColor(prevMyColor => {
          const isMyTurnNow = nextTurnColor === prevMyColor;
          setIsMyTurn(isMyTurnNow);
          setDiceDisabled(!isMyTurnNow);
          return prevMyColor;
        });
        
        return prev;
      });
      
      diceNumberValue.current = 0;
    });

    socketService.onError(() => {});

    socketService.joinGame(roomCode, myUserId);

    return () => {
      socketService.leaveGame(roomCode, myUserId);
      socketService.removeAllListeners();
      socketService.disconnectFromGame();
    };
  }, [roomCode, user]);

  const rollDice = useCallback(() => {
    if (!isMyTurn || diceDisabled) return;
    
    const myUserId = getMyUserId();
    setDiceDisabled(true);
    socketService.rollDice(roomCode, myUserId);
  }, [isMyTurn, diceDisabled, roomCode, user]);

  const moveToken = useCallback((tokenId, fromPosition, toPosition) => {
    if (!isMyTurn) return;
    
    const myUserId = getMyUserId();
    socketService.moveToken(roomCode, myUserId, tokenId, fromPosition, toPosition);
  }, [isMyTurn, roomCode, user]);

  const nextTurn = useCallback(() => {}, []);

  return (
    <GameContext.Provider value={{ 
      diceNumberValue, 
      rollDice, 
      diceDisabled, 
      setDiceDisabled, 
      currentPlayer, 
      nextTurn, 
      playerPositions, 
      setPlayerPositions, 
      setCurrentPlayer, 
      size, 
      setSize, 
      win, 
      setWin, 
      defaultBoardSize,
      myColor,
      isMyTurn,
      gameStatus,
      players,
      moveToken,
      gameEnded,
      winner,
      roomCode
    }}>
      {children}
    </GameContext.Provider>
  );
};
