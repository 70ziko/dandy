import * as THREE from "three";
import { Card } from "./Card";
import gsap from "gsap";

interface HandConstructorParams {
  scene: THREE.Scene;
  numCards?: number;
  tablePosition?: THREE.Vector3;
}

interface FanProperties {
  fanRadius: number;
  fanSpread: number;
  zOffset: number;
}

export class Hand {
  private scene: THREE.Scene;
  private numCards: number;
  private tablePosition: THREE.Vector3;
  private cards: Card[];

  constructor({
    scene,
    numCards = 5,
    tablePosition = new THREE.Vector3(0, -6, 5),
  }: HandConstructorParams) {
    this.scene = scene;
    this.numCards = numCards;
    this.tablePosition = tablePosition;
    this.cards = [];
    this.spawnCards();
  }

  private calculateFanProperties(numCards: number): FanProperties {
    const fanRadius = 1.5 + (numCards + 1) * 0.1;
    const maxSpread = (Math.PI * 2) / 3; // 120 degrees
    const minSpread = Math.PI / 6; // 30 degrees
    const fanSpread = Math.min(maxSpread, minSpread + numCards * 0.1);
    const zOffset = Math.max(0.01, 0.05 - numCards * 0.002);
    return { fanRadius, fanSpread, zOffset };
  }

  private spawnCards(): void {
    const { fanRadius, fanSpread, zOffset } = this.calculateFanProperties(
      this.numCards
    );
    const centerAngle = Math.PI / 2;

    for (let i = 0; i < this.numCards; i++) {
      const angle = centerAngle + fanSpread * (i / (this.numCards - 1) - 0.5);
      const xPos = Math.cos(angle) * fanRadius;
      const yPos = Math.sin(angle) * fanRadius + this.tablePosition.y;
      const zPos = i * zOffset + this.tablePosition.z;

      const position = new THREE.Vector3(xPos, yPos, zPos);
      const rotation = new THREE.Euler(-Math.PI * 0.2, 0, angle + Math.PI / 2);

      const card = new Card({ scene: this.scene, position, rotation });
      this.cards.push(card);
    }
  }

  // Helper function for generating normally distributed random numbers
  private generateNormalRandom(mean: number, stdDev: number): number {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * stdDev + mean;
  }
  public checkCards() {
    const tableCenter = new THREE.Vector3(0, -5, 0);
    const tableSize = 10; // Half size, so cards land within +/- tableSize

    this.cards.forEach((card, index) => {
      let x = this.generateNormalRandom(tableCenter.x, 1);
      let z = this.generateNormalRandom(tableCenter.z + 2, 1);

      x = Math.max(Math.min(x, tableSize), -tableSize);
      z = Math.max(Math.min(z, tableSize), -tableSize);

      const landingPosition = new THREE.Vector3(x, tableCenter.y, z);
      const targetRotation = new THREE.Euler(
        card.getMesh().rotation.x + Math.PI / 3,
        card.getMesh().rotation.y,
        card.getMesh().rotation.z,
        "XYZ"
      );

      const controlPoint = new THREE.Vector3(
        card.getMesh().position.x,
        card.getMesh().position.y + 7, // Adjust for arc height
        card.getMesh().position.z
      );

      gsap.to(card.getMesh().position, {
        bezier: {
          type: "quadratic",
          values: [card.getMesh().position, controlPoint, landingPosition],
        },
        duration: 1,
        ease: "power1.inOut",
      });

      gsap.to(
        card.getMesh().rotation,
        {
          z: targetRotation.z,
          duration: 1,
          ease: "power1.inOut",
          onComplete: () => {
            console.log(`Card ${index} animation complete`);
            card.setBasePosition(landingPosition);
            card.getMesh().position.copy(landingPosition);
            card.setBaseRotation(targetRotation);
            card.getMesh().rotation.copy(targetRotation);
          },
        }
      );
      card.stopFloatingAnimation();
    });
  }

  public remove(): void {
    this.cards.forEach((card) => card.remove());
    this.cards = [];
  }
}
