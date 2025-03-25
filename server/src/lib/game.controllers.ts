import type { RequestHandler } from "express";
import type { DrawParams, ActionParams, ActionBody } from "../types";

import { websocket } from "../services/websocket";
import { initializeDeck, drawRandomCards } from "./deck-handlers";
import { signData } from "./crypto";
import { redis } from "../services/redis";
import { errorLog } from "./loggers";

export const drawHandler: RequestHandler<DrawParams> = async (req, res) => {
  try {
    const { tableId } = req.params;
    const guestId = req.headers["x-guest-id"] as string;

    let gameState = await redis.getGameState(tableId);
    
    if (!gameState) {
      gameState = {
        players: [guestId],
        deck: initializeDeck(),
        currentTurn: null,
        turnCounter: 0,
      };
      await redis.setGameState(tableId, gameState);
    }

    const playerState = await redis.getPlayerState(guestId);
    if (playerState) {
      res.json(signData(playerState));
      return;
    }

    const cards = drawRandomCards(1, gameState.deck);
    
    gameState.players.push(guestId);
    if (!gameState.currentTurn) {
      gameState.currentTurn = guestId;
    }
    await redis.setGameState(tableId, gameState);
    
    await redis.setPlayerState(guestId, { cards, tableId });

    res.json(signData(cards));
  } catch (error) {
    errorLog('Error in draw endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const actionHandler: RequestHandler<ActionParams, any, ActionBody> = async (req, res) => {
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
    errorLog('Error in action endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
