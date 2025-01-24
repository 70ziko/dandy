// Card.js
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

export class Card {
  constructor(scene, position = new THREE.Vector3(), rotation = new THREE.Euler()) {
    this.scene = scene;
    this.mesh = this.createMesh();
    this.initialPosition = position.clone();
    this.initialRotation = rotation.clone();
    this.setPosition(position);
    this.setRotation(rotation);
    this.scene.add(this.mesh);
    this.isHovered = false;
  }

  createMesh() {
    const geometry = new THREE.PlaneGeometry(1, 1.618);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('https://threejsfundamentals.org/threejs/resources/images/wall.jpg');
    const material = new THREE.MeshStandardMaterial({ 
      map: texture,
      side: THREE.DoubleSide 
    });
    return new THREE.Mesh(geometry, material);
  }

  setPosition(position) {
    this.mesh.position.copy(position);
  }

  setRotation(rotation) {
    this.mesh.rotation.copy(rotation);
  }

  spreadFrom(center, direction, amount) {
    const targetPosition = this.initialPosition.clone();
    targetPosition.x += direction * amount;
    
    new TWEEN.Tween(this.mesh.position)
      .to({ x: targetPosition.x }, 300)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();
  }

  resetPosition() {
    if (!this.isHovered) {
      new TWEEN.Tween(this.mesh.position)
        .to({ 
          x: this.initialPosition.x,
          y: this.initialPosition.y
        }, 300)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
    }
  }

  animate(timestamp, index) {
    if (!this.isHovered) {
      this.mesh.position.y += Math.sin(timestamp * 0.001 + index * 0.5) * 0.001;
    }
  }

  hover() {
    this.isHovered = true;
    new TWEEN.Tween(this.mesh.position)
      .to({ y: this.initialPosition.y + 0.5 }, 300)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();
  }

  unhover() {
    this.isHovered = false;
    this.resetPosition();
  }

  remove() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}