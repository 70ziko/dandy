import { v4 as uuidv4 } from 'uuid';
import { redis } from './redis';

interface GuestSession {
  id: string;
  createdAt: number;
  lastActive: number;
  currentGame?: string;
}

export class GuestService {
  private readonly SESSION_TTL = 24 * 60 * 60; // 24 hours in seconds

  async createGuest(): Promise<string> {
    const guestId = `guest_${uuidv4()}`;
    const session: GuestSession = {
      id: guestId,
      createdAt: Date.now(),
      lastActive: Date.now()
    };

    await redis.setGuestSession(guestId, session, this.SESSION_TTL);
    return guestId;
  }

  async getGuestSession(guestId: string): Promise<GuestSession | null> {
    return await redis.getGuestSession(guestId);
  }

  async refreshSession(guestId: string): Promise<void> {
    const session = await this.getGuestSession(guestId);
    if (session) {
      session.lastActive = Date.now();
      await redis.setGuestSession(guestId, session, this.SESSION_TTL);
    }
  }

  async validateGuest(guestId: string): Promise<boolean> {
    if (!guestId || !guestId.startsWith('guest_')) {
      return false;
    }

    const session = await this.getGuestSession(guestId);
    if (!session) {
      return false;
    }

    const now = Date.now();
    const sessionAge = (now - session.lastActive) / 1000; // Convert to seconds
    if (sessionAge > this.SESSION_TTL) {
      await redis.deleteKey(`guest:${guestId}`);
      return false;
    }

    await this.refreshSession(guestId);
    return true;
  }

  async updateGuestGame(guestId: string, gameId: string | undefined): Promise<void> {
    const session = await this.getGuestSession(guestId);
    if (session) {
      session.currentGame = gameId;
      session.lastActive = Date.now();
      await redis.setGuestSession(guestId, session, this.SESSION_TTL);
    }
  }

  async removeGuest(guestId: string): Promise<void> {
    await redis.deleteKey(`guest:${guestId}`);
  }
}

export const guestService = new GuestService();
export default guestService;
