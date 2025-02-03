import express from 'express';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import crypto from 'crypto';
import type { GameStates, DrawParams, ActionParams, ActionBody } from './types'
import { initializeDeck, drawRandomCards } from './core';

const app = express();
const port = process.env.PORT || 3001;

const gameStates: GameStates = {};

let guestCounter = 0;

app.use(function(req: Request, res: Response, next: NextFunction) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Guest-Id, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.headers['x-guest-id']) {
    const guestId = `guest_${++guestCounter}`;
    res.setHeader('X-Guest-Id', guestId);
  }
  next();
});

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

app.get<DrawParams>('/:tableId/draw', ((req: Request<DrawParams>, res: Response) => {
  const { tableId } = req.params;
  const guestId = req.headers['x-guest-id'] as string;
  
  if (!gameStates[tableId]) {
    gameStates[tableId] = {
      players: new Map(),
      deck: initializeDeck(),
      currentTurn: null,
      turnCounter: 0
    };
  }
  
  const gameState = gameStates[tableId];
  
  if (gameState.players.has(guestId)) {
    const existingCards = gameState.players.get(guestId);
    return res.json(signData(existingCards));
  }
  
  const cards = drawRandomCards(5, gameState.deck); // Default to 5 cards per player
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


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
