import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

interface GameSocket {
  tableId: string;
  playerId: string;
}

export class WebSocketService {
  private io: Server | null = null;
  private activeSockets: Map<string, GameSocket> = new Map();

  initialize(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // TODO: Implement full WebSocket functionality
      // Placeholder event handlers
      socket.on('joinGame', (data: { tableId: string, playerId: string }) => {
        this.activeSockets.set(socket.id, {
          tableId: data.tableId,
          playerId: data.playerId
        });
        socket.join(data.tableId);
        
        // Notify other players
        socket.to(data.tableId).emit('playerJoined', {
          playerId: data.playerId
        });
      });

      socket.on('leaveGame', (tableId: string) => {
        const socketData = this.activeSockets.get(socket.id);
        if (socketData) {
          socket.leave(tableId);
          this.activeSockets.delete(socket.id);
          
          // Notify other players
          socket.to(tableId).emit('playerLeft', {
            playerId: socketData.playerId
          });
        }
      });

      socket.on('disconnect', () => {
        const socketData = this.activeSockets.get(socket.id);
        if (socketData) {
          socket.to(socketData.tableId).emit('playerLeft', {
            playerId: socketData.playerId
          });
          this.activeSockets.delete(socket.id);
        }
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Utility methods for future implementation
  emitToGame(tableId: string, event: string, data: any) {
    if (!this.io) return;
    this.io.to(tableId).emit(event, data);
  }

  emitToPlayer(playerId: string, event: string, data: any) {
    if (!this.io) return;
    const socketId = this.findSocketByPlayerId(playerId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  private findSocketByPlayerId(playerId: string): string | undefined {
    for (const [socketId, data] of this.activeSockets.entries()) {
      if (data.playerId === playerId) {
        return socketId;
      }
    }
    return undefined;
  }
}

export const websocket = new WebSocketService();
export default websocket;
