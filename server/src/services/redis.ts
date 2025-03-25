import { createClient } from 'redis';
import type { Card, GameState, PlayerState } from '../types';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

redisClient.connect().catch(console.error);

export const gameStateKey = (tableId: string) => `table:${tableId}`;
export const playerKey = (guestId: string) => `player:${guestId}`;

export const redis = {
  async setGuestSession(guestId: string, data: any, ttl: number = 3600): Promise<void> {
    await redisClient.set(
      `guest:${guestId}`,
      JSON.stringify(data),
      { EX: ttl }
    );
  },

  async getGuestSession(guestId: string): Promise<any> {
    const data = await redisClient.get(`guest:${guestId}`);
    return data ? JSON.parse(data) : null;
  },

  async refreshGuestSession(guestId: string, ttl: number = 3600): Promise<void> {
    await redisClient.expire(`guest:${guestId}`, ttl);
  },

  async setGameState(tableId: string, state: GameState): Promise<void> {
    await redisClient.set(gameStateKey(tableId), JSON.stringify(state));
  },

  async getGameState(tableId: string): Promise<GameState | null> {
    const state = await redisClient.get(gameStateKey(tableId));
    return state ? JSON.parse(state) : null;
  },

  async setPlayerState(guestId: string, state: PlayerState): Promise<void> {
    await redisClient.set(playerKey(guestId), JSON.stringify(state));
  },

  async getPlayerState(guestId: string): Promise<PlayerState | null> {
    const state = await redisClient.get(playerKey(guestId));
    return state ? JSON.parse(state) : null;
  },

  async addPlayerToGame(tableId: string, guestId: string): Promise<void> {
    const game = await redis.getGameState(tableId);
    
    if (game) {
      if (!game.players) {
        game.players = [guestId];
      }
      game.players.push(guestId);
      await redis.setGameState(tableId, game);
    }
  },

  async removePlayerFromGame(tableId: string, guestId: string): Promise<void> {
    const game = await redis.getGameState(tableId);
    
    if (game && game.players) {
      const index = game.players.indexOf(guestId);
      if (index !== -1) {
        game.players.splice(index, 1);
      }
      await redis.setGameState(tableId, game);
    }
  },

  async deleteKey(key: string): Promise<void> {
    await redisClient.del(key);
  },

  async exists(key: string): Promise<boolean> {
    return await redisClient.exists(key) === 1;
  }
};

export default redis;
