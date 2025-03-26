import * as THREE from "three";
import gsap from "gsap";
import { FluidBackgroundHandle } from "../fluidBackground";
import { CardValue } from "types";

interface CardConstructorParams {
  scene: THREE.Scene;
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  fluidRef?: React.RefObject<FluidBackgroundHandle>;
  value?: CardValue | "back"; 
}

export class Card {
  protected value: CardValue | "back";
  protected scene: THREE.Scene;
  protected mesh: THREE.Mesh;
  protected hitbox: THREE.Mesh;
  protected basePosition: THREE.Vector3;
  protected baseRotation: THREE.Euler;
  protected isHovered: boolean;
  protected isDragging: boolean;
  protected currentTween: gsap.core.Timeline | gsap.core.Tween | null;
  protected floatingAnimation: gsap.core.Tween | null;
  protected originalPosition: THREE.Vector3;
  protected originalRotation: THREE.Euler;
  protected fluidRef?: React.RefObject<FluidBackgroundHandle>;
  protected edgePoints: THREE.Vector3[];
  protected lastPosition: THREE.Vector3;
  protected lastTime: number;
  protected numInterpolationPoints = 8;
  protected lastUpdateTime = 0;
  protected updateInterval = 16; // ~60fps in milliseconds

  constructor({
    scene,
    position = new THREE.Vector3(),
    rotation = new THREE.Euler(),
    fluidRef,
    value = "back", 
  }: CardConstructorParams) {
    this.scene = scene;
    this.value = value;
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
    this.isDragging = false;
    this.currentTween = null;
    this.floatingAnimation = null;
    this.startFloatingAnimation();

    this.originalPosition = position.clone();
    this.originalRotation = rotation.clone();
    this.fluidRef = fluidRef;
    this.edgePoints = this.calculateEdgePoints();

    this.lastPosition = position.clone();
    this.lastTime = performance.now();
  }

  protected getCardTexturePath(value: CardValue | "back"): string {
    if (value === "back") {
      return "/assets/black-reverse.jpg";
    }
    
    // Format: /assets/cards/{value}{first letter of suit}.png
    // e.g. for 10 of spades: /assets/cards/10S.png
    const suitLetter = value.suit.charAt(0).toUpperCase();
    return `/assets/cards/${value.value}${suitLetter}.png`;
  }

  protected createMesh(): THREE.Mesh {
    const width = 1;
    const height = 1.618;
    const thickness = 0.0;
    const radius = 0.05;

    const shape = new THREE.Shape();
    const x = -width / 2,
      y = -height / 2;

    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height
    );
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
      bevelSegments: 3,
      UVGenerator: {
        generateSideWallUV: function (
          _geometry: THREE.ExtrudeGeometry,
          _vertices: number[],
          _indexA: number,
          _indexB: number,
          _indexC: number,
          _indexD: number
        ) {
          return [
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1, 0),
            new THREE.Vector2(1, 1),
            new THREE.Vector2(0, 1),
          ];
        },
        generateTopUV: function (
          _geometry: THREE.ExtrudeGeometry,
          _vertices: number[],
          _indexA: number,
          _indexB: number,
          _indexC: number
        ) {
          return [
            new THREE.Vector2(0, 1),
            new THREE.Vector2(1, 1),
            new THREE.Vector2(1, 0),
          ];
        },
        generateBottomUV: function (
          _geometry: THREE.ExtrudeGeometry,
          _vertices: number[],
          _indexA: number,
          _indexB: number,
          _indexC: number
        ) {
          return [
            new THREE.Vector2(0, 1),
            new THREE.Vector2(1, 1),
            new THREE.Vector2(1, 0),
          ];
        },
      },
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    if (!geometry.attributes.position || !geometry.attributes.uv) {
      throw new Error("Invalid geometry: missing position or UV attributes");
    }

    const uvAttribute = geometry.attributes.uv;
    const positions = geometry.attributes.position;

    // Update UV coordinates with validation
    for (let i = 0; i < uvAttribute.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);

      if (isNaN(x) || isNaN(y)) {
        console.warn(`Invalid position at index ${i}: x=${x}, y=${y}`);
        continue;
      }

      uvAttribute.setXY(i, (x + width / 2) / width, (y + height / 2) / height);
    }

    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    const textureLoader = new THREE.TextureLoader();
    const frontTexturePath = this.getCardTexturePath(this.value);
    const frontTexture = textureLoader.load(frontTexturePath);
    const backTexture = textureLoader.load("/assets/black-reverse.jpg");

    const frontMaterial = new THREE.MeshPhongMaterial({
      map: frontTexture,
      side: THREE.FrontSide,
      shininess: 0,
      depthTest: false,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const backMaterial = new THREE.MeshPhongMaterial({
      map: backTexture,
      side: THREE.BackSide,
      shininess: 0,
      depthTest: false,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const materials = [frontMaterial, backMaterial];
    const mesh = new THREE.Mesh(geometry, materials);
    geometry.center();

    return mesh;
  }

  protected createHitbox(): THREE.Mesh {
    const width = 1;
    const height = 2;
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshPhongMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geometry, material);
  }

  public getHitbox(): THREE.Mesh {
    return this.hitbox;
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  public startFloatingAnimation(): void {
    if (this.floatingAnimation) {
      this.floatingAnimation.kill();
    }
    if (!this.isHovered) {
      this.floatingAnimation = gsap.to(this.mesh.position, {
        y: this.basePosition.y + 0.1,
        duration: 1.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        onUpdate: () => this.updateFluidBackground(),
      });
    }
  }

  public stopFloatingAnimation(): void {
    if (this.floatingAnimation) {
      this.floatingAnimation.kill();
    }
  }

  public spreadFrom(_center: number, direction: number, amount: number): void {
    if (this.isHovered) return;

    const targetX = this.basePosition.x + direction * amount;

    if (this.currentTween) {
      this.currentTween.kill();
    }

    this.currentTween = gsap.to(this.mesh.position, {
      x: targetX,
      duration: 0.5,
      ease: "power2.out",
      onUpdate: () => this.updateFluidBackground(),
    });
  }

  public resetPosition(): void {
    if (!this.isHovered) {
      if (this.currentTween) {
        this.currentTween.kill();
      }

      this.currentTween = gsap.timeline();
      this.currentTween
        .to(this.mesh.position, {
          x: this.originalPosition.x,
          y: this.originalPosition.y,
          z: this.originalPosition.z,
          duration: 0.5,
          ease: "power2.out",
          onUpdate: () => this.updateFluidBackground(),
        })
        .to(
          this.mesh.rotation,
          {
            x: this.originalRotation.x,
            y: this.originalRotation.y,
            z: this.originalRotation.z,
            duration: 0.5,
            ease: "power2.out",
            onUpdate: () => this.updateFluidBackground(),
          },
          "-=0.5"
        );
    }
  }

  public hover(): void {
    if (this.isHovered) return;
    this.isHovered = true;

    if (this.floatingAnimation) {
      this.floatingAnimation.kill();
    }

    if (this.currentTween) {
      this.currentTween.kill();
    }

    const tl = gsap.timeline();

    tl.to(this.mesh.position, {
      y: this.basePosition.y + 0.5,
      z: this.basePosition.z - 0.5,
      duration: 0.4,
      ease: "back.out(1.7)",
      onUpdate: () => this.updateFluidBackground(),
    });
    // .to(
    //   this.mesh.rotation,
    //   {
    //     x: -Math.PI * 0.1,
    //     duration: 0.3,
    //     ease: "power2.out",
    //     onUpdate: () => this.updateFluidBackground(),
    //   },
    //   "-=0.2"
    // );

    this.currentTween = tl;
  }

  public unhover(): void {
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
      },
    });

    tl.to(this.mesh.position, {
      x: this.originalPosition.x,
      y: this.originalPosition.y,
      z: this.originalPosition.z,
      duration: 0.4,
      ease: "power3.out",
      onUpdate: () => this.updateFluidBackground(),
    }).to(
      this.mesh.rotation,
      {
        x: this.originalRotation.x,
        y: this.originalRotation.y,
        z: this.originalRotation.z,
        duration: 0.3,
        ease: "power2.out",
        onUpdate: () => this.updateFluidBackground(),
      },
      "-=0.2"
    );
  }

  public startDrag(mousePos: THREE.Vector3): void {
    this.isDragging = true;
    if (this.floatingAnimation) {
      this.floatingAnimation.kill();
    }
    if (this.currentTween) {
      this.currentTween.kill();
    }
    this.currentTween = gsap.to(this.mesh.position, {
      x: mousePos.x,
      y: mousePos.y,
      z: mousePos.z,
      duration: 0.2,
      ease: "power2.out",
      onUpdate: () => this.updateFluidBackground(),
    });
  }

  public drag(mousePos: THREE.Vector3): void {
    if (!this.isDragging) return;
    if (this.currentTween) {
      this.currentTween.kill();
    }
    this.currentTween = gsap.to(this.mesh.position, {
      x: mousePos.x,
      y: mousePos.y,
      z: mousePos.z,
      duration: 0.2,
      ease: "power2.out",
      onUpdate: () => this.updateFluidBackground(),
    });
  }

  public endDrag(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.resetPosition();
  }

  public remove(): void {
    this.scene.remove(this.mesh);
    this.scene.remove(this.hitbox);
    this.mesh.geometry.dispose();
    this.hitbox.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach((material) => material.dispose());
    } else {
      this.mesh.material.dispose();
    }
  }

  protected calculateEdgePoints(): THREE.Vector3[] {
    const width = 1;
    const height = 1.618;
    const numAdditional = 4; // Additional points along each edge
    const points: THREE.Vector3[] = [];

    // Bottom edge
    for (let i = 0; i <= numAdditional; i++) {
      const t = i / numAdditional;
      points.push(new THREE.Vector3(-width / 2 + width * t, -height / 2, 0));
    }

    // Right edge
    for (let i = 1; i <= numAdditional; i++) {
      const t = i / numAdditional;
      points.push(new THREE.Vector3(width / 2, -height / 2 + height * t, 0));
    }

    // Top edge
    for (let i = 1; i <= numAdditional; i++) {
      const t = i / numAdditional;
      points.push(new THREE.Vector3(width / 2 - width * t, height / 2, 0));
    }

    // Left edge
    for (let i = 1; i < numAdditional; i++) {
      const t = i / numAdditional;
      points.push(new THREE.Vector3(-width / 2, height / 2 - height * t, 0));
    }

    return points;
  }

  protected updateFluidBackground(): void {
    if (!this.fluidRef?.current) return;

    const now = performance.now();
    if (now - this.lastUpdateTime < this.updateInterval) return;
    this.lastUpdateTime = now;

    const camera = this.scene.getObjectByName("camera") as THREE.Camera;
    if (!camera) return;

    const currentTime = now;
    const deltaTime = Math.max((currentTime - this.lastTime) / 1000, 0.01);
    const currentPosition = this.mesh.position.clone();
    const velocity = currentPosition
      .clone()
      .sub(this.lastPosition)
      .divideScalar(deltaTime);
    const velocityScale = -0.4;
    const scaledVelocity = velocity.multiplyScalar(velocityScale);

    for (const point of this.edgePoints) {
      const worldPos = point
        .clone()
        .applyEuler(this.mesh.rotation)
        .add(this.mesh.position);
      const vector = worldPos.project(camera);
      const screenX = ((vector.x + 1.1) * window.innerWidth) / 2;
      const screenY = ((-vector.y + 0.9) * window.innerHeight) / 2;

      if (
        screenX >= 0 &&
        screenX <= window.innerWidth &&
        screenY >= 0 &&
        screenY <= window.innerHeight
      ) {
        const rotationalVelocity = new THREE.Vector2(
          -this.mesh.rotation.z * point.y,
          this.mesh.rotation.z * point.x
        ).multiplyScalar(1.0);
        const totalVelocityX = scaledVelocity.x + rotationalVelocity.x;
        const totalVelocityY = scaledVelocity.y + rotationalVelocity.y;

        // Original: addInput
        this.fluidRef.current.addInput(
          screenX,
          screenY,
          totalVelocityX,
          totalVelocityY
        );

        // New: addCardInput including the card's texture
        // const frontMat = Array.isArray(this.mesh.material)
        //   ? this.mesh.material[0] as THREE.MeshPhongMaterial
        //   : this.mesh.material as THREE.MeshPhongMaterial;
        // const frontTexture = frontMat.map;
        // if (frontTexture) {
        //   this.fluidRef.current.addCardInput(screenX, screenY, totalVelocityX, totalVelocityY, frontTexture);
        // } else {
        // const textureLoader = new THREE.TextureLoader();
        // const brushTexture = textureLoader.load("/assets/square_brush.png");
        // this.fluidRef.current.addCardInput(screenX, screenY, totalVelocityX, totalVelocityY, brushTexture);
        // }
      }
    }
    this.lastPosition.copy(currentPosition);
    this.lastTime = currentTime;
  }

  public setBasePosition(position: THREE.Vector3): void {
    this.basePosition.copy(position);
  }

  public setBaseRotation(rotation: THREE.Euler): void {
    this.baseRotation.copy(rotation);
  }

  public getValue(): CardValue | "back" {
    return this.value;
  }
  
  public setValue(value: CardValue | "back"): void {
    this.value = value;
    
    const textureLoader = new THREE.TextureLoader();
    const frontTexturePath = this.getCardTexturePath(value);
    const frontTexture = textureLoader.load(frontTexturePath);
    
    if (Array.isArray(this.mesh.material)) {
      const frontMaterial = this.mesh.material[0] as THREE.MeshPhongMaterial;
      frontMaterial.map = frontTexture;
      frontMaterial.needsUpdate = true;
    }
  }
}

interface GuiCardConstructorParams extends CardConstructorParams {
  frontTexture?: string;
  alt: string;
  onClick?: () => void;
  value?: CardValue | "back";
}

export class GuiCard extends Card {
  private frontTextureUrl?: string;
  public alt: string;
  public onClick?: () => void;

  constructor(params: GuiCardConstructorParams) {
    super(params);
    this.frontTextureUrl = params.frontTexture;
    this.alt = params.alt;
    this.onClick = params.onClick;

    if (this.frontTextureUrl) {
      const loader = new THREE.TextureLoader();
      const texture = loader.load(this.frontTextureUrl);
      texture.center.set(0, 0);

      const frontMaterial = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.FrontSide,
        shininess: 0,
        depthTest: false,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });

      if (Array.isArray(this.mesh.material)) {
        this.mesh.material[0] = frontMaterial;
      }
    } else if (this.value === "back") {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = 420;
      canvas.height = 420;

      if (context) {
        context.fillStyle = "#E6E6E6";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = "bold 48px Arial";
        context.fillStyle = "#3D3D3D";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(this.alt, canvas.width / 2, canvas.height / 2);
      }

      const defaultTexture = new THREE.CanvasTexture(canvas);
      
      const frontMaterial = new THREE.MeshPhongMaterial({
        map: defaultTexture,
        side: THREE.FrontSide,
        shininess: 0,
        depthTest: false,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });

      if (Array.isArray(this.mesh.material)) {
        this.mesh.material[0] = frontMaterial;
      }
    }

    if (this.onClick) {
      this.hitbox.userData.onClick = this.onClick;
    }
  }
}