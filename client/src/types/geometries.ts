import * as THREE from 'three';

interface SceneRefs {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

interface CardGameSceneProps {
  numCards?: number;
}


interface DeckConstructorParams {
  scene: THREE.Scene;
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  cardsInDeck?: number;
}


interface Card {
  hitbox: THREE.Object3D;
  mesh: THREE.Mesh;
  isHovered: boolean;
  hover: () => void;
  unhover: () => void;
  resetPosition: () => void;
  startDrag: (position: THREE.Vector3) => void;
  drag: (position: THREE.Vector3) => void;
  endDrag: () => void;
}

export type {
  SceneRefs,
  CardGameSceneProps,
  Card,
  DeckConstructorParams,
};