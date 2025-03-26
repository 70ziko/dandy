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

export type { CardValue, DrawResponse };
