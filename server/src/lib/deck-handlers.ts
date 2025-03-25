import type { Card } from "../types";

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

function shuffleDeck(deck: Card[]): Card[] {
  const shuffledDeck = [...deck];
  for (let i = shuffledDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]]
  }
  return shuffledDeck;
}

function initializeDeck(): Card[] {
  const suits: Card["suit"][] = ["hearts", "diamonds", "clubs", "spades"];
  const values: Card["value"][] = ["A", "9", "10", "J", "Q", "K"];

  const deck: Card[] = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  return shuffleDeck(deck);
}


export { drawRandomCards, initializeDeck };
