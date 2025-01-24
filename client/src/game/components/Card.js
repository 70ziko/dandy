import * as THREE from 'three';
import gsap from 'gsap';

export class Card {
  constructor(scene, position = new THREE.Vector3(), rotation = new THREE.Euler()) {
    this.scene = scene;
    this.mesh = this.createMesh();
    
    // Store initial values
    this.basePosition = position.clone();
    this.baseRotation = rotation.clone();
    
    // Set initial position and rotation
    this.mesh.position.copy(position);
    this.mesh.rotation.copy(rotation);
    this.scene.add(this.mesh);
    
    this.isHovered = false;
    this.currentTween = null;
    this.floatingAnimation = null;
    this.startFloatingAnimation();
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

  startFloatingAnimation() {
    // Create infinite floating animation
    this.floatingAnimation = gsap.to(this.mesh.position, {
      y: this.basePosition.y + 0.1,
      duration: 1,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
  }

  spreadFrom(center, direction, amount) {
    if (this.isHovered) return;
    
    const targetX = this.basePosition.x + (direction * amount);
    
    if (this.currentTween) {
      this.currentTween.kill();
    }
    
    this.currentTween = gsap.to(this.mesh.position, {
      x: targetX,
      duration: 0.5,
      ease: "power2.out"
    });
  }

  resetPosition() {
    if (!this.isHovered) {
      if (this.currentTween) {
        this.currentTween.kill();
      }
      
      this.currentTween = gsap.to(this.mesh.position, {
        x: this.basePosition.x,
        y: this.basePosition.y,
        z: this.basePosition.z,
        duration: 0.5,
        ease: "power2.out"
      });
    }
  }

  hover() {
    this.isHovered = true;
    
    if (this.floatingAnimation) {
      this.floatingAnimation.pause();
    }
    
    if (this.currentTween) {
      this.currentTween.kill();
    }
    
    // Create a timeline for synchronized animations
    const tl = gsap.timeline({
      onComplete: () => {
        console.log("Hover animation complete");
      }
    });
    
    tl.to(this.mesh.position, {
      y: this.basePosition.y + 1.5,
      z: this.basePosition.z - 0.8,
      duration: 0.4,
      ease: "back.out(1.7)"
    })
    .to(this.mesh.rotation, {
      x: -0.2,
      duration: 0.3,
      ease: "power2.out"
    }, "-=0.2"); // Start slightly before position animation ends
    
    this.currentTween = tl;
  }

  unhover() {
    this.isHovered = false;
    
    if (this.currentTween) {
      this.currentTween.kill();
    }
    
    const tl = gsap.timeline({
      onComplete: () => {
        if (!this.isHovered) {
          this.startFloatingAnimation();
        }
      }
    });
    
    tl.to(this.mesh.position, {
      x: this.basePosition.x,
      y: this.basePosition.y,
      z: this.basePosition.z,
      duration: 0.4,
      ease: "power3.out"
    })
    .to(this.mesh.rotation, {
      x: this.baseRotation.x,
      y: this.baseRotation.y,
      z: this.baseRotation.z,
      duration: 0.3,
      ease: "power2.out"
    }, "-=0.2");
    
    this.currentTween = tl;
  }

  remove() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}