import * as THREE from "three";
import { Card } from "./Card";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { CustomEase } from "gsap/all";
import { CardValue } from "types";

gsap.registerPlugin(MotionPathPlugin);
gsap.registerPlugin(CustomEase);

interface HandConstructorParams {
  scene: THREE.Scene;
  cardValues: CardValue[];
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
  private cardValues: CardValue[];
  private holdingPosition: THREE.Vector3;
  private lyingPosition: THREE.Vector3;
  private cards: Card[];
  public isHolding: boolean;

  constructor({
    scene,
    cardValues = [],
    holdingPosition = new THREE.Vector3(0, -6, 5),
    lyingPosition = new THREE.Vector3(0, -7, 5),
  }: HandConstructorParams) {
    this.scene = scene;
    this.cardValues = cardValues;
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
    const numCards = this.cardValues.length;
    const { fanRadius, fanSpread, zOffset } = this.calculateFanProperties(numCards);
    const centerAngle = Math.PI / 2;

    for (let i = 0; i < numCards; i++) {
      const angle = centerAngle + fanSpread * (i / (numCards - 1 || 1) - 0.5);
      const xPos = Math.cos(angle) * fanRadius;
      const yPos = Math.sin(angle) * fanRadius + this.holdingPosition.y;
      const zPos = i * zOffset + this.holdingPosition.z;

      const holdingPosition = new THREE.Vector3(xPos, yPos, zPos);
      const rotation = new THREE.Euler(-Math.PI * 0.2, 0, angle + Math.PI / 2);

      const card = new Card({ 
        scene: this.scene, 
        position: holdingPosition, 
        rotation,
        value: "back"//this.cardValues[i]
      });
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
    this.cards.forEach((card) => card.stopFloatingAnimation());
    
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
      const targetRotation = this.isHolding
        ? new THREE.Euler(
            - Math.PI * 0.2,
            0,
            angle + Math.PI / 2
          )
        : new THREE.Euler(
            Math.PI / 2,
            0,
            angle + Math.PI / 2
          )

      const tl = gsap.timeline();

      tl.to(card.getMesh().position, {
        x: targetholdingPosition.x,
        y: targetholdingPosition.y,
        z: targetholdingPosition.z,
        duration: 0.5,
        ease: "power2.inOut",
      }, 0)
      .to(card.getMesh().rotation, {
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
      }, 0);
    });
  }

  public rethrow: boolean = true;
  private cardsThrown: boolean = false;
  private initialCardPositions: { position: THREE.Vector3, rotation: THREE.Euler }[] = [];

  public throwCards() {
    if (this.cardsThrown && !this.rethrow) {
      console.log("Cards already thrown, cannot throw again");
      return;
    }
    
    if (!this.cardsThrown) {
      this.initialCardPositions = this.cards.map(card => ({
        position: card.getMesh().position.clone(),
        rotation: card.getMesh().rotation.clone()
      }));
      this.performThrow();
    } 
    else if (this.rethrow) {
      this.returnCards();
    }
  }

  private performThrow() {
    const tableCenter = new THREE.Vector3(0, -5, 0);
    const tableSize = 10; // Half size, so cards land within +/- tableSize

    this.cards.forEach((card, index) => {
      let x = this.generateNormalRandom(card.getMesh().position.x, 0.5);
      let z = this.generateNormalRandom(tableCenter.z + 2, 0.2);

      x = Math.max(Math.min(x, tableSize), -tableSize);
      z = Math.max(Math.min(z, tableSize), -tableSize);

      const landingPosition = new THREE.Vector3(x, tableCenter.y, z);
      const targetRotation = new THREE.Euler(
        card.getMesh().rotation.x - Math.PI / 3,
        card.getMesh().rotation.y,
        card.getMesh().rotation.z,
        "XYZ"
      );

      const controlPoint = new THREE.Vector3(
        card.getMesh().position.x,
        card.getMesh().position.y - 1.5, // concave height
        card.getMesh().position.z - 1.5
      );

      const path = [
        card.getMesh().position,
        controlPoint,
        landingPosition
      ];
      const tl = gsap.timeline();
      
      tl.to(
        card.getMesh().position,
        {
          motionPath: {
            path: path,
            type: "quadratic",
            autoRotate: false,
          },
          duration: 1,
          ease: CustomEase.create(
            "custom",
            "M0,0 C0.084,0.61 0.152,0.823 0.179,0.905 0.209,0.998 0.374,1 1,1 "
          ),
          y: -500,
        },
        0
      ).to(
        card.getMesh().rotation,
        {
          x: targetRotation.x,
          y: targetRotation.y,
          z: targetRotation.z,
          duration: 0.5,
          ease: CustomEase.create(
            "custom",
            "M0,0 C0.084,0.61 0.152,0.823 0.179,0.905 0.209,0.998 0.374,1 1,1 "
          ),
          onComplete: () => {
            card.setBasePosition(landingPosition);
            card.getMesh().position.copy(landingPosition);
            card.setBaseRotation(targetRotation);
            card.getMesh().rotation.copy(targetRotation);
          },
        },
        0
      );
      card.stopFloatingAnimation();
    });
    
    this.cardsThrown = true;
  }

  private returnCards() {
    this.cards.forEach((card, index) => {
      const initialPos = this.initialCardPositions[index].position;
      const initialRot = this.initialCardPositions[index].rotation;
      
      const controlPoint = new THREE.Vector3(
        card.getMesh().position.x,
        card.getMesh().position.y + 2,
        card.getMesh().position.z
      );

      const path = [
        card.getMesh().position,
        controlPoint,
        initialPos
      ];
      
      const tl = gsap.timeline();
      
      tl.to(card.getMesh().position, {
        motionPath: {
          path: path,
          type: "quadratic",
          autoRotate: false
        },
        duration: 1,
        ease: "power2.in"
      }, 0)
      .to(card.getMesh().rotation, {
        x: initialRot.x,
        y: initialRot.y,
        z: initialRot.z,
        duration: 1,
        ease: "power2.in",
        onComplete: () => {
          card.setBasePosition(initialPos);
          card.getMesh().position.copy(initialPos);
          card.setBaseRotation(initialRot);
          card.getMesh().rotation.copy(initialRot);
        }
      }, 0);
    });
    
    this.cardsThrown = false;
  }

  public remove(): void {
    this.cards.forEach((card) => card.remove());
    this.cards = [];
  }
}
