import { PokerFigureType, CardRank, CardSuit, PokerFigureBase } from '../types/game';

export const CARD_RANKS: CardRank[] = ['9', '10', 'J', 'Q', 'K', 'A'];
export const CARD_SUITS: CardSuit[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];

interface PokerFigureConfig extends PokerFigureBase {
  selectionSteps: {
    type: 'rank' | 'suit' | 'ranks' | 'rankPairs';
    label: string;
    options?: CardRank[] | CardSuit[];
    count?: number; // For multiple selections
  }[];
}

export const POKER_FIGURES: Record<PokerFigureType, PokerFigureConfig> = {
  HighCard: {
    type: 'HighCard',
    displayName: 'High Card',
    description: 'Select your highest card',
    value: 1,
    selectionSteps: [
      { type: 'rank', label: 'Select your high card', options: CARD_RANKS }
    ]
  },
  Pair: {
    type: 'Pair',
    displayName: 'Pair',
    description: 'Select the rank of your pair',
    value: 2,
    selectionSteps: [
      { type: 'rank', label: 'Select pair rank', options: CARD_RANKS }
    ]
  },
  TwoPair: {
    type: 'TwoPair',
    displayName: 'Two Pair',
    description: 'Select the ranks of your two pairs',
    value: 3,
    selectionSteps: [
      { type: 'rankPairs', label: 'Select both pair ranks', options: CARD_RANKS, count: 2 }
    ]
  },
  ThreeOfAKind: {
    type: 'ThreeOfAKind',
    displayName: 'Three of a Kind',
    description: 'Select the rank of your three cards',
    value: 4,
    selectionSteps: [
      { type: 'rank', label: 'Select three of a kind rank', options: CARD_RANKS }
    ]
  },
  Straight: {
    type: 'Straight',
    displayName: 'Straight',
    description: 'Select the highest card in your straight',
    value: 5,
    selectionSteps: [
      { type: 'rank', label: 'Select highest card', options: CARD_RANKS }
    ]
  },
  Flush: {
    type: 'Flush',
    displayName: 'Flush',
    description: 'Select the suit and highest card of your flush',
    value: 6,
    selectionSteps: [
      { type: 'suit', label: 'Select suit', options: CARD_SUITS },
    //   { type: 'rank', label: 'Select highest card', options: CARD_RANKS }
    ]
  },
  FullHouse: {
    type: 'FullHouse',
    displayName: 'Full House',
    description: 'Select the ranks of your three of a kind and pair',
    value: 7,
    selectionSteps: [
      { type: 'rank', label: 'Select three of a kind rank', options: CARD_RANKS },
      { type: 'rank', label: 'Select pair rank', options: CARD_RANKS }
    ]
  },
  FourOfAKind: {
    type: 'FourOfAKind',
    displayName: 'Four of a Kind',
    description: 'Select the rank of your four cards',
    value: 8,
    selectionSteps: [
      { type: 'rank', label: 'Select four of a kind rank', options: CARD_RANKS }
    ]
  },
  StraightFlush: {
    type: 'StraightFlush',
    displayName: 'Straight Flush',
    description: 'Select the suit and highest card of your straight flush',
    value: 9,
    selectionSteps: [
      { type: 'suit', label: 'Select suit', options: CARD_SUITS },
      { type: 'rank', label: 'Select highest card', options: CARD_RANKS }
    ]
  },
  RoyalFlush: {
    type: 'RoyalFlush',
    displayName: 'Royal Flush',
    description: 'Select the suit of your royal flush',
    value: 10,
    selectionSteps: [
      { type: 'suit', label: 'Select suit', options: CARD_SUITS }
    ]
  }
};