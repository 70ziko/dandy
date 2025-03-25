interface Card {
    suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
    value: 'A' | '9' | '10' | 'J' | 'Q' | 'K';
}

interface GameState {
  players: string[]; // guestIds
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

interface PlayerState {
  cards: Card[];
  tableId: string;
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
  PlayerState,
  DrawParams,
  ActionParams,
  ActionBody,
};