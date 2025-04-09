import { Router } from "express";
import { drawHandler, actionHandler } from "../lib/game.controllers";
import type { DrawParams, ActionParams, ActionBody } from "../types/game";

export const router = Router();
router.get<DrawParams>("/:tableId/draw", drawHandler);
router.post<ActionParams, any, ActionBody>(
    "/:tableId/action", 
    actionHandler
);

export default router;