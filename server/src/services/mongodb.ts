import { MongoClient, Collection } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dandy';
const client = new MongoClient(uri);

interface ArchivedGame {
  gameId: string;
  players: string[];
  startTime: Date;
  endTime: Date;
  actions: {
    playerId: string;
    action: string;
    timestamp: Date;
  }[];
  finalState: any;
}

class MongoService {
  private client: MongoClient;
  private archiveCollection: Collection<ArchivedGame> | null = null;

  constructor() {
    this.client = client;
    this.connect();
  }

  private async connect() {
    try {
      await this.client.connect();
      console.log('Connected to MongoDB');
      
      const db = this.client.db('dandy');
      this.archiveCollection = db.collection<ArchivedGame>('archived_games');
      
      // Create indexes
      await this.archiveCollection.createIndex({ gameId: 1 }, { unique: true });
      await this.archiveCollection.createIndex({ players: 1 });
      await this.archiveCollection.createIndex({ startTime: 1 });
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }
  }

  async archiveGame(gameData: Omit<ArchivedGame, 'gameId'>): Promise<string> {
    if (!this.archiveCollection) throw new Error('MongoDB not connected');

    const gameId = uuidv4();
    const archivedGame: ArchivedGame = {
      gameId,
      ...gameData
    };

    await this.archiveCollection.insertOne(archivedGame);
    return gameId;
  }

  async getArchivedGame(gameId: string): Promise<ArchivedGame | null> {
    if (!this.archiveCollection) throw new Error('MongoDB not connected');

    return await this.archiveCollection.findOne({ gameId });
  }

  async getPlayerGames(playerId: string): Promise<ArchivedGame[]> {
    if (!this.archiveCollection) throw new Error('MongoDB not connected');

    return await this.archiveCollection
      .find({ players: playerId })
      .sort({ startTime: -1 })
      .toArray();
  }

  async getRecentGames(limit: number = 10): Promise<ArchivedGame[]> {
    if (!this.archiveCollection) throw new Error('MongoDB not connected');

    return await this.archiveCollection
      .find({})
      .sort({ endTime: -1 })
      .limit(limit)
      .toArray();
  }

  async addGameAction(gameId: string, action: { playerId: string; action: string; timestamp: Date }) {
    if (!this.archiveCollection) throw new Error('MongoDB not connected');

    await this.archiveCollection.updateOne(
      { gameId },
      { $push: { actions: action } }
    );
  }

  async close() {
    await this.client.close();
    console.log('MongoDB connection closed');
  }
}

export const mongodb = new MongoService();
export default mongodb;
