interface Card {
    suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
    value: 'A' | '9' | '10' | 'J' | 'Q' | 'K';
}

interface GameState {
  players: Map<string, Card[]>; // guestId -> cards
  deck: Card[];
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

export type {
  Card,
  GameState,
  GameStates,
  DrawParams,
  ActionParams,
  ActionBody,
};