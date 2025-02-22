import type { Request, Response, NextFunction } from 'express';
import { guestService } from '../services/guest';

export async function guestAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const guestId = req.headers['x-guest-id'] as string;

    if (!guestId) {
      const newGuestId = await guestService.createGuest();
      res.setHeader('X-Guest-Id', newGuestId);
      req.headers['x-guest-id'] = newGuestId;
      return next();
    }

    const isValid = await guestService.validateGuest(guestId);
    if (!isValid) {
      const newGuestId = await guestService.createGuest();
      res.setHeader('X-Guest-Id', newGuestId);
      req.headers['x-guest-id'] = newGuestId;
      return next();
    }

    await guestService.refreshSession(guestId);
    next();
  } catch (error) {
    console.error('Guest authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function rateLimiter(
  windowMs: number = 60 * 1000, // 1 minute
  maxRequests: number = 100
) {
  const requests = new Map<string, { count: number; lastReset: number }>();

  return async function(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const guestId = req.headers['x-guest-id'] as string;
    if (!guestId) {
      return next();
    }

    const now = Date.now();
    const requestData = requests.get(guestId) || { count: 0, lastReset: now };

    if (now - requestData.lastReset > windowMs) {
      requestData.count = 0;
      requestData.lastReset = now;
    }

    requestData.count++;
    requests.set(guestId, requestData);

    if (requestData.count > maxRequests) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    next();
  };
}

export function validateRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const guestId = req.headers['x-guest-id'] as string;
  const validGuestIdFormat = /^guest_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!validGuestIdFormat.test(guestId)) {
    res.status(400).json({ error: 'Invalid guest ID format' });
    return;
  }
  // TODO: Actually validate the guest ID with the guest service

  next();
}
