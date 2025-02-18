import express from "express";
import { createServer } from "http";
import type { Request, Response, RequestHandler } from "express";
import type { GameStates, DrawParams, ActionParams, ActionBody } from "./types";
import { initializeDeck, drawRandomCards } from "./core";
import { signData } from "./utils";
import { redis } from "./services/redis";
import { mongodb } from "./services/mongodb";
import { websocket } from "./services/websocket";
import { guestAuth, rateLimiter, validateRequest } from "./middleware/auth";

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3001;

// Initialize WebSocket
websocket.initialize(server);

// Apply middlewares
app.use((req: Request, res: Response, next) => {
  res.header("Access-Control-Allow-Origin", process.env.CLIENT_URL || "http://localhost:3000");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Guest-Id, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// Apply rate limiting
app.use(rateLimiter());

// Guest authentication middleware
app.use(guestAuth);

// Routes that require guest validation
app.use("/:tableId/*", validateRequest);

const drawHandler: RequestHandler<DrawParams> = async (req, res) => {
  try {
    const { tableId } = req.params;
    const guestId = req.headers["x-guest-id"] as string;

    // Get game state from Redis
    let gameState = await redis.getGameState(tableId);
    
    if (!gameState) {
      gameState = {
        players: [],
        deck: initializeDeck(),
        currentTurn: null,
        turnCounter: 0,
      };
      await redis.setGameState(tableId, gameState);
    }

    // Check if player already has cards
    const playerState = await redis.getPlayerState(guestId);
    if (playerState?.cards) {
      res.json(signData(playerState.cards));
      return;
    }

    // Draw new cards
    const cards = drawRandomCards(5, gameState.deck);
    
    // Update game and player state
    gameState.players.push(guestId);
    if (!gameState.currentTurn) {
      gameState.currentTurn = guestId;
    }
    await redis.setGameState(tableId, gameState);
    
    await redis.setPlayerState(guestId, { cards, tableId });

    res.json(signData(cards));
  } catch (error) {
    console.error('Error in draw endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const actionHandler: RequestHandler<ActionParams, any, ActionBody> = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { action, value } = req.body;
    const guestId = req.headers["x-guest-id"] as string;

    const gameState = await redis.getGameState(tableId);
    if (!gameState) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    // TODO: Implement game logic
    // This would handle actions like:
    // - Calling poker figures
    // - Challenging calls
    // - Calculating scores

    // Emit action to all players in the game via WebSocket
    websocket.emitToGame(tableId, 'gameAction', {
      playerId: guestId,
      action,
      value
    });

    res.json({ status: "action received" });
  } catch (error) {
    console.error('Error in action endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

app.get<DrawParams>("/:tableId/draw", drawHandler);
app.post<ActionParams, any, ActionBody>("/:tableId/action", express.json(), actionHandler);

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    await mongodb.close();
    process.exit(0);
  });
});
