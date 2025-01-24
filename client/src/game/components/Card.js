import * as THREE from 'three';
import gsap from 'gsap';

export class Card {
  constructor(scene, position = new THREE.Vector3(), rotation = new THREE.Euler()) {
    this.scene = scene;
    this.mesh = this.createMesh();
    this.hitbox = this.createHitbox();
    
    this.basePosition = position.clone();
    this.baseRotation = rotation.clone();
    
    this.mesh.position.copy(position);
    this.mesh.rotation.copy(rotation);
    this.hitbox.position.copy(position);
    this.hitbox.rotation.copy(rotation);
    
    this.scene.add(this.mesh);
    this.scene.add(this.hitbox);
    
    this.isHovered = false;
    this.currentTween = null;
    this.floatingAnimation = null;
    this.startFloatingAnimation();

    this.originalPosition = position.clone();
    this.originalRotation = rotation.clone();
  }

  createMesh() {
    const width = 1;
    const height = 1.618;
    const thickness = 0.02;
    const radius = 0.05;

    const shape = new THREE.Shape();
    const x = -width/2, y = -height/2;
    
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);

    const extrudeSettings = {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelOffset: 0,
      bevelSegments: 3
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    const textureLoader = new THREE.TextureLoader();
    const frontTexture = textureLoader.load('/assets/black-reverse.jpg');
    const backTexture = textureLoader.load('/assets/black-reverse.jpg');
    
    const frontMaterial = new THREE.MeshStandardMaterial({ 
      map: frontTexture,
      side: THREE.FrontSide
    });
    
    const backMaterial = new THREE.MeshStandardMaterial({ 
      map: backTexture,
      side: THREE.BackSide
    });
    
    // const sideMaterial = new THREE.MeshStandardMaterial({ 
    //   color: 0xFFFFFF,
    //   side: THREE.FrontSide
    // });

    const materials = [
    //   sideMaterial, 
      frontMaterial,
      backMaterial 
    ];

    const mesh = new THREE.Mesh(geometry, materials);
    
    geometry.center();
    
    return mesh;
  }

  createHitbox() {
    const width = 1; // Slightly larger than card
    const height = 2; // Scaled with card's aspect ratio
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    return new THREE.Mesh(geometry, material);
  }

  startFloatingAnimation() {
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
      
      this.currentTween = gsap.timeline();
      this.currentTween.to(this.mesh.position, {
        x: this.originalPosition.x,
        y: this.originalPosition.y,
        z: this.originalPosition.z,
        duration: 0.5,
        ease: "power2.out"
      }).to(this.mesh.rotation, {
        x: this.originalRotation.x,
        y: this.originalRotation.y,
        z: this.originalRotation.z,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.5");
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
    
    const tl = gsap.timeline({
      onComplete: () => {
        console.log("Hover animation complete");
      }
    });
    
    tl.to(this.mesh.position, {
      y: this.basePosition.y + 0.5,
      z: this.basePosition.z - 0.5,
      duration: 0.4,
      ease: "back.out(1.7)"
    })
    .to(this.mesh.rotation, {
      x: -Math.PI * 0.1, // Adjusted tilt for table perspective
      duration: 0.3,
      ease: "power2.out"
    }, "-=0.2");
    
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
          this.mesh.position.copy(this.originalPosition);
          this.mesh.rotation.copy(this.originalRotation);
          this.startFloatingAnimation();
        }
      }
    });
    
    tl.to(this.mesh.position, {
      x: this.originalPosition.x,
      y: this.originalPosition.y,
      z: this.originalPosition.z,
      duration: 0.4,
      ease: "power3.out"
    })
    .to(this.mesh.rotation, {
      x: this.originalRotation.x,
      y: this.originalRotation.y,
      z: this.originalRotation.z,
      duration: 0.3,
      ease: "power2.out"
    }, "-=0.2");
    
    this.currentTween = tl;
  }

  remove() {
    this.scene.remove(this.mesh);
    this.scene.remove(this.hitbox);
    this.mesh.geometry.dispose();
    this.hitbox.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach(material => material.dispose());
    } else {
      this.mesh.material.dispose();
    }
  }
}