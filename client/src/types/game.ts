import * as THREE from 'three';

interface SceneRefs {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

interface Props {
  numCards?: number;
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
  Props,
  Card,
};