// Hand.js
import * as THREE from 'three';
import { Card } from './Card';

export class Hand {
  constructor(scene, numCards = 5, tablePosition = new THREE.Vector3(0, -6, 5)) {
    this.scene = scene;
    this.numCards = numCards;
    this.tablePosition = tablePosition;
    this.cards = [];
    this.spawnCards();
  }

  calculateFanProperties(numCards) {
    const fanRadius = 1.5 + ((numCards + 1) * 0.1);
    const maxSpread = Math.PI * 2 / 3; // 120 degrees
    const minSpread = Math.PI / 6; // 30 degrees
    const fanSpread = Math.min(maxSpread, minSpread + (numCards * 0.1));
    const zOffset = Math.max(0.01, 0.05 - (numCards * 0.002));
    return { fanRadius, fanSpread, zOffset };
  }

  spawnCards() {
    const { fanRadius, fanSpread, zOffset } = this.calculateFanProperties(this.numCards);
    const centerAngle = Math.PI / 2;

    for (let i = 0; i < this.numCards; i++) {
      const angle = centerAngle + fanSpread * (i / (this.numCards - 1) - 0.5);
      const xPos = Math.cos(angle) * fanRadius;
      const yPos = Math.sin(angle) * fanRadius + this.tablePosition.y;
      const zPos = (i * zOffset) + this.tablePosition.z;

      const position = new THREE.Vector3(xPos, yPos, zPos);
      const rotation = new THREE.Euler(-Math.PI * 0.2, 0, angle + Math.PI / 2);

      const card = new Card(this.scene, position, rotation);
      this.cards.push(card);
    }
  }

  remove() {
    this.cards.forEach((card) => card.remove());
    this.cards = [];
  }
}
