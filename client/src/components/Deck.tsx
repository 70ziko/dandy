import * as THREE from "three";
import type { DeckConstructorParams } from "../types";

export class Deck {
  private scene: THREE.Scene;
  private cards: THREE.Mesh[] = [];
  private cardsInDeck: number;

  constructor({
    scene,
    position = new THREE.Vector3(0, 0, 0),
    rotation = new THREE.Euler(Math.PI / 2, 0, Math.PI / 2),
    cardsInDeck = 24,
  }: DeckConstructorParams) {
    this.scene = scene;
    this.cardsInDeck = cardsInDeck;
    this.createDeck(position, rotation);
  }

  private createDeck(position: THREE.Vector3, rotation: THREE.Euler): void {
    const geometry = new THREE.BoxGeometry(1, 1.618, this.cardsInDeck * 0.01);

    const textureLoader = new THREE.TextureLoader();
    const reverseTexture = textureLoader.load("/assets/black-reverse.jpg");

    const material = new THREE.MeshBasicMaterial({ 
      map: reverseTexture
    });
    const card = new THREE.Mesh(geometry, material);
    card.position.copy(position);
    card.rotation.copy(rotation);
    this.scene.add(card);
    this.cards.push(card);
  }

  public remove(): void {
    this.cards.forEach((card) => {
      this.scene.remove(card);
      card.geometry.dispose();
    });
  }
}

export default Deck;
