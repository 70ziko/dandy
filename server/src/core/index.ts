import type { Card } from '../types';

function drawRandomCards(count: number, deck: Card[]): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    if (deck.length === 0) {
      break;
    }
    const randomIndex = Math.floor(Math.random() * deck.length);
    const card = deck.splice(randomIndex, 1)[0];
    cards.push(card);
  }
  return cards;
}

function initializeDeck(): Card[] {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values: Card['value'][] = ['A', '9', '10', 'J', 'Q', 'K'];
  
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export { drawRandomCards, initializeDeck };