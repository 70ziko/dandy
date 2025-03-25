import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

redisClient.connect().catch(console.error);

export const gameStateKey = (tableId: string) => `game:${tableId}`;
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

  async setGameState(tableId: string, state: any): Promise<void> {
    await redisClient.set(gameStateKey(tableId), JSON.stringify(state));
  },

  async getGameState(tableId: string): Promise<any> {
    const state = await redisClient.get(gameStateKey(tableId));
    return state ? JSON.parse(state) : null;
  },

  async setPlayerState(guestId: string, state: any): Promise<void> {
    await redisClient.set(playerKey(guestId), JSON.stringify(state));
  },

  async getPlayerState(guestId: string): Promise<any> {
    const state = await redisClient.get(playerKey(guestId));
    return state ? JSON.parse(state) : null;
  },

  async addPlayerToGame(tableId: string, guestId: string): Promise<void> {
    const gameKey = gameStateKey(tableId);
    const game = await redis.getGameState(tableId);
    
    if (game) {
      game.players = [...(game.players || []), guestId];
      await redis.setGameState(tableId, game);
    }
  },

  async removePlayerFromGame(tableId: string, guestId: string): Promise<void> {
    const gameKey = gameStateKey(tableId);
    const game = await redis.getGameState(tableId);
    
    if (game) {
      game.players = (game.players || []).filter((id: string) => id !== guestId);
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
