import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.gameSocket = null;
    this.isConnected = false;
    this.pendingEmits = [];
  }

  connectToGame() {
    if (this.gameSocket) {
      this.gameSocket.removeAllListeners();
      this.gameSocket.disconnect();
    }

    this.isConnected = false;

    this.gameSocket = io(`${SOCKET_URL}/game`, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.gameSocket.on('connect', () => {
      this.isConnected = true;
      
      while (this.pendingEmits.length > 0) {
        const { event, data } = this.pendingEmits.shift();
        this.gameSocket.emit(event, data);
      }
    });

    this.gameSocket.on('connect_error', () => {
      this.isConnected = false;
    });

    this.gameSocket.on('disconnect', () => {
      this.isConnected = false;
    });

    return this.gameSocket;
  }

  getGameSocket() {
    if (!this.gameSocket) {
      return this.connectToGame();
    }
    return this.gameSocket;
  }

  safeEmit(event, data) {
    const socket = this.getGameSocket();
    if (this.isConnected && socket.connected) {
      socket.emit(event, data);
    } else {
      this.pendingEmits.push({ event, data });
    }
  }

  disconnectFromGame() {
    if (this.gameSocket) {
      this.gameSocket.removeAllListeners();
      this.gameSocket.disconnect();
      this.gameSocket = null;
      this.isConnected = false;
      this.pendingEmits = [];
    }
  }

  joinGame(roomCode, userId) {
    this.safeEmit('join_game', { roomCode, userId });
  }

  rollDice(roomCode, userId) {
    this.safeEmit('roll_dice', { roomCode, userId });
  }

  moveToken(roomCode, userId, tokenId, fromPosition, toPosition) {
    this.safeEmit('move_token', { roomCode, userId, tokenId, fromPosition, toPosition });
  }

  leaveGame(roomCode, userId) {
    if (this.gameSocket && this.isConnected) {
      this.gameSocket.emit('leave_game', { roomCode, userId });
    }
  }

  on(event, callback) {
    const socket = this.getGameSocket();
    socket.off(event);
    socket.on(event, callback);
  }

  onGameJoined(callback) {
    this.on('game_joined', callback);
  }

  onPlayerJoined(callback) {
    this.on('player_joined', callback);
  }

  onGameStarted(callback) {
    this.on('game_started', callback);
  }

  onDiceRolled(callback) {
    this.on('dice_rolled', callback);
  }

  onTokenMoved(callback) {
    this.on('token_moved', callback);
  }

  onGameEnded(callback) {
    this.on('game_ended', callback);
  }

  onPlayerLeft(callback) {
    this.on('player_left', callback);
  }

  onPlayerDisconnected(callback) {
    this.on('player_disconnected', callback);
  }

  onError(callback) {
    this.on('error', callback);
  }

  removeAllListeners() {
    if (this.gameSocket) {
      this.gameSocket.removeAllListeners();
    }
  }
}

export const socketService = new SocketService();
export default socketService;
