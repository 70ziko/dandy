interface DrawResponse {
  data: {
    cards: CardValue[];
    tableId: string;
  };
  signature: string;
}
interface CardValue {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  value: "A" | "9" | "10" | "J" | "Q" | "K";
}

// Types for poker game 
export type CardRank = '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type CardSuit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';

export type PokerFigureType = 
  | 'HighCard' 
  | 'Pair' 
  | 'TwoPair' 
  | 'ThreeOfAKind' 
  | 'Straight' 
  | 'Flush' 
  | 'FullHouse' 
  | 'FourOfAKind' 
  | 'StraightFlush' 
  | 'RoyalFlush';

export interface PokerFigureBase {
  type: PokerFigureType;
  displayName: string;
  description: string;
  value: number; // Numerical value for ranking
}

export interface HighCardParams {
  rank: CardRank;
}

export interface PairParams {
  rank: CardRank;
}

export interface TwoPairParams {
  firstPairRank: CardRank;
  secondPairRank: CardRank;
}

export interface ThreeOfAKindParams {
  rank: CardRank;
}

export interface StraightParams {
  highestRank: CardRank;
}

export interface FlushParams {
  suit: CardSuit;
  highestRank: CardRank;
}

export interface FullHouseParams {
  threeOfAKindRank: CardRank;
  pairRank: CardRank;
}

export interface FourOfAKindParams {
  rank: CardRank;
}

export interface StraightFlushParams {
  suit: CardSuit;
  highestRank: CardRank;
}

export interface RoyalFlushParams {
  suit: CardSuit;
}

export type PokerFigureParams =
  | HighCardParams
  | PairParams
  | TwoPairParams
  | ThreeOfAKindParams
  | StraightParams
  | FlushParams
  | FullHouseParams
  | FourOfAKindParams
  | StraightFlushParams
  | RoyalFlushParams;

export interface PokerFigure extends PokerFigureBase {
  params: PokerFigureParams;
}

export type { CardValue, DrawResponse };
