import express from 'express';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import crypto from 'crypto';
import path from 'path';

const app = express();
const port = process.env.PORT || 3001;

interface GameState {
  players: Map<string, string[]>; // guestId -> cards
  turnCounter: number;
  currentTurn: string | null;
  pokerFigures?: string[] | null;
  lastAction?: {
    player: string;
    action: string;
    value?: any;
  };
}

interface GameStates {
  [tableId: string]: GameState;
}

const gameStates: GameStates = {};

let guestCounter = 0;

app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.headers['x-guest-id']) {
    const guestId = `guest_${++guestCounter}`;
    res.setHeader('X-Guest-Id', guestId);
  }
  next();
});

app.use(express.static(path.join(__dirname, '../../client/build')));

function generateRandomCards(count: number): string[] {
  const cards: string[] = [];
  const deck = Array.from({length: 52}, (_, i) => i.toString());
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * deck.length);
    const card = deck.splice(randomIndex, 1)[0];
    cards.push(card);
  }
  
  return cards;
}

function signData(data: any): { data: any, signature: string } {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const stringified = JSON.stringify(data);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(stringified)
    .digest('hex');
  
  return {
    data,
    signature
  };
}

interface DrawParams {
  tableId: string;
}

interface ActionParams {
  tableId: string;
}

interface ActionBody {
  action: string;
  value?: any;
}

app.get<DrawParams>('/:tableId/draw', ((req: Request<DrawParams>, res: Response) => {
  const { tableId } = req.params;
  const guestId = req.headers['x-guest-id'] as string;
  
  if (!gameStates[tableId]) {
    gameStates[tableId] = {
      players: new Map(),
      currentTurn: null,
      turnCounter: 0
    };
  }
  
  const gameState = gameStates[tableId];
  
  if (gameState.players.has(guestId)) {
    const existingCards = gameState.players.get(guestId);
    return res.json(signData(existingCards));
  }
  
  const cards = generateRandomCards(5); // Default to 5 cards per player
  gameState.players.set(guestId, cards);
  
  if (!gameState.currentTurn) {
    gameState.currentTurn = guestId;
  }
  
  res.json(signData(cards));
}) as RequestHandler<DrawParams>);

// Placeholder for handling game events
app.post<ActionParams, any, ActionBody>('/:tableId/action', express.json(), ((req: Request<ActionParams, any, ActionBody>, res: Response) => {
  const { tableId } = req.params;
  const { action, value } = req.body;
  const guestId = req.headers['x-guest-id'] as string;
  
  // TODO: Implement game logic
  // This would handle actions like:
  // - Calling poker figures
  // - Challenging calls
  // - Calculating scores
  
  res.json({ status: 'not implemented' });
}) as RequestHandler<ActionParams>);

app.get('/', ((req: Request, res: Response) => {
  if (!req.cookies.guestId) {
    const guestId = `guest_${crypto.randomBytes(8).toString('hex')}`;
    res.cookie('guestId', guestId, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // 1 day
  }
  res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
}) as RequestHandler);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
