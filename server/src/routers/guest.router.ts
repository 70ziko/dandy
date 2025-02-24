import { Router } from "express";
import type { Request, Response, RequestHandler } from "express";
import { guestService } from "../services/guest";

export const router = Router();

router.get("/guest", async (req: Request, res: Response) => {
  try {
    console.log("Guest request:", req.headers);
    const existingGuestId = req.headers["x-guest-id"] as string;
    if (
      existingGuestId &&
      (await guestService.validateGuest(existingGuestId))
    ) {
      res.json({ guestId: existingGuestId });
      return;
    }

    const guestId = await guestService.createGuest();
    console.log("New guest ID:", guestId);
    res.header("X-Guest-Id", guestId);
    res.json({ guestId });
  } catch (error) {
    console.error("Error in guest endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});