import * as THREE from "three";
import { Card } from "./Card";
import gsap from "gsap";

interface HandConstructorParams {
  scene: THREE.Scene;
  numCards?: number;
  holdingPosition?: THREE.Vector3;
  lyingPosition?: THREE.Vector3;
  isHolding?: boolean;
}

interface FanProperties {
  fanRadius: number;
  fanSpread: number;
  zOffset: number;
}

export class Hand {
  private scene: THREE.Scene;
  private numCards: number;
  private holdingPosition: THREE.Vector3;
  private lyingPosition: THREE.Vector3;
  private cards: Card[];
  public isHolding: boolean;

  constructor({
    scene,
    numCards = 5,
    holdingPosition = new THREE.Vector3(0, -6, 5),
    lyingPosition = new THREE.Vector3(0, -10, 3),
  }: HandConstructorParams) {
    this.scene = scene;
    this.numCards = numCards;
    this.holdingPosition = holdingPosition;
    this.lyingPosition = lyingPosition;
    this.cards = [];
    this.isHolding = true;
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
      const yPos = Math.sin(angle) * fanRadius + this.holdingPosition.y;
      const zPos = i * zOffset + this.holdingPosition.z;

      const holdingPosition = new THREE.Vector3(xPos, yPos, zPos);
      const rotation = new THREE.Euler(-Math.PI * 0.2, 0, angle + Math.PI / 2);

      const card = new Card({ scene: this.scene, position: holdingPosition, rotation });
      this.cards.push(card);
    }
  }

  private generateNormalRandom(mean: number, stdDev: number): number {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * stdDev + mean;
  }

  public toggleHolding(): void {
    this.isHolding = !this.isHolding;
    const targetPosition = this.isHolding
      ? this.holdingPosition
      : this.lyingPosition;

    const targetNumCards = this.cards.length;
    const { fanRadius, fanSpread, zOffset } = this.calculateFanProperties(
      targetNumCards
    );
    const centerAngle = Math.PI / 2;

    this.cards.forEach((card, index) => {
      const angle =
        centerAngle + fanSpread * (index / (targetNumCards - 1) - 0.5);

      const fanRadiusAdjusted = this.isHolding ? fanRadius : fanRadius * 0.8;

      const xPos = Math.cos(angle) * fanRadiusAdjusted;
      const yPos =
        Math.sin(angle) * fanRadiusAdjusted + targetPosition.y;
      const zPos = index * zOffset + targetPosition.z;

      const targetholdingPosition = new THREE.Vector3(xPos, yPos, zPos);
      const targetRotation = new THREE.Euler(
        -Math.PI * 0.2,
        0,
        angle + Math.PI / 2
      );

      gsap.to(card.getMesh().position, {
        x: targetholdingPosition.x,
        y: targetholdingPosition.y,
        z: targetholdingPosition.z,
        duration: 0.5,
        ease: "power2.inOut",
      });

      gsap.to(card.getMesh().rotation, {
        x: targetRotation.x,
        y: targetRotation.y,
        z: targetRotation.z,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          card.setBasePosition(targetholdingPosition);
          card.getMesh().position.copy(targetholdingPosition);
          card.setBaseRotation(targetRotation);
          card.getMesh().rotation.copy(targetRotation);
        },
      });
    });
  }

  public checkCards() {
    const tableCenter = new THREE.Vector3(0, -5, 0);
    const tableSize = 10; // Half size, so cards land within +/- tableSize

    this.cards.forEach((card, index) => {
      let x = this.generateNormalRandom(tableCenter.x, 0.5);
      let z = this.generateNormalRandom(tableCenter.z + 2, 0.5);

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
        card.getMesh().position.y + 2, // Adjust for arc height
        card.getMesh().position.z
      );

      const path = [
        card.getMesh().position,
        controlPoint,
        landingPosition
      ];

      gsap.to(card.getMesh().position, {
        motionPath: {
          path: path,
          type: "quadratic",
          autoRotate: false
        },
        duration: 1,
        ease: "cubic.inOut",
      });

      gsap.to(
        card.getMesh().rotation,
        {
          z: targetRotation.z,
          duration: 1,
          ease: "cubic.inOut",
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
