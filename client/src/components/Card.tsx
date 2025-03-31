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
  protected mesh: THREE.Object3D;
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

  protected createRoundedRectangle(width: number, height: number, radius: number): THREE.Shape {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;

    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);

    return shape;
  }

  protected createMesh(): THREE.Group {
    const width = 1;
    const height = 1.618;
    const radius = 0.05;

    const shape = this.createRoundedRectangle(width, height, radius);
    const roundedShape = new THREE.ShapeGeometry(shape);

    const coords = roundedShape.getAttribute('position');
    const uvs = roundedShape.getAttribute('uv');
    for (let i = 0; i < coords.count; i++) {
      const x = coords.getX(i);
      const y = coords.getY(i);
      uvs.setXY(i, (x + width/2) / width, (y + height/2) / height);
    }
    roundedShape.attributes.uv.needsUpdate = true;
    
    const textureLoader = new THREE.TextureLoader();
    const frontTexture = this.value === "back" 
      ? textureLoader.load("/assets/black-reverse.jpg")
      : textureLoader.load(this.getCardTexturePath(this.value));
    const backTexture = textureLoader.load("/assets/black-reverse.jpg");

    const frontMaterial = new THREE.MeshPhongMaterial({
      map: frontTexture,
      side: THREE.DoubleSide,
      shininess: 0,
      depthTest: true,
    });

    const backMaterial = new THREE.MeshPhongMaterial({
      map: backTexture,
      side: THREE.DoubleSide,
      shininess: 0,
      depthTest: true,
    });

    const frontMesh = new THREE.Mesh(roundedShape, frontMaterial);
    const backMesh = new THREE.Mesh(roundedShape, backMaterial);
    
    backMesh.rotation.y = Math.PI;
    backMesh.position.z = -0.001;
    
    const group = new THREE.Group();
    group.add(frontMesh);
    group.add(backMesh);

    return group;
  }

  protected createHitbox(): THREE.Mesh {
    const width = 1;
    const height = 1.618;
    const radius = 0.05;
    const shape = this.createRoundedRectangle(width, height, radius);
    const geometry = new THREE.ShapeGeometry(shape);

    const coords = geometry.getAttribute('position');
    const uvs = geometry.getAttribute('uv');
    for (let i = 0; i < coords.count; i++) {
      const x = coords.getX(i);
      const y = coords.getY(i);
      uvs.setXY(i, (x + width/2) / width, (y + height/2) / height);
    }
    geometry.attributes.uv.needsUpdate = true;

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

  public getMesh(): THREE.Object3D {
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
    
    this.hitbox.geometry.dispose();
    if (this.hitbox.material instanceof THREE.Material) {
      this.hitbox.material.dispose();
    }
    
    this.mesh.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
  }

  protected calculateEdgePoints(): THREE.Vector3[] {
    const width = 1;
    const height = 1.618;
    const radius = 0.05;
    const numPoints = 24;
    const points: THREE.Vector3[] = [];

    const addArcPoints = (
      center: THREE.Vector2,
      radius: number,
      startAngle: number,
      endAngle: number,
      segments: number
    ) => {
      for (let i = 0; i <= segments; i++) {
        const angle = startAngle + (endAngle - startAngle) * (i / segments);
        const x = center.x + radius * Math.cos(angle);
        const y = center.y + radius * Math.sin(angle);
        points.push(new THREE.Vector3(x, y, 0));
      }
    };

    const x = -width / 2;
    const y = -height / 2;
    const pointsPerCorner = 3;
    const pointsPerSide = numPoints / 4 - pointsPerCorner;

    addArcPoints(
      new THREE.Vector2(x + width - radius, y + radius),
      radius,
      -Math.PI / 2,
      0,
      pointsPerCorner
    );

    for (let i = 1; i < pointsPerSide; i++) {
      const t = i / pointsPerSide;
      points.push(new THREE.Vector3(x + width, y + radius + (height - 2 * radius) * t, 0));
    }

    addArcPoints(
      new THREE.Vector2(x + width - radius, y + height - radius),
      radius,
      0,
      Math.PI / 2,
      pointsPerCorner
    );

    for (let i = pointsPerSide - 1; i > 0; i--) {
      const t = i / pointsPerSide;
      points.push(new THREE.Vector3(x + width - radius - (width - 2 * radius) * t, y + height, 0));
    }

    addArcPoints(
      new THREE.Vector2(x + radius, y + height - radius),
      radius,
      Math.PI / 2,
      Math.PI,
      pointsPerCorner
    );

    for (let i = pointsPerSide - 1; i > 0; i--) {
      const t = i / pointsPerSide;
      points.push(new THREE.Vector3(x, y + height - radius - (height - 2 * radius) * t, 0));
    }

    addArcPoints(
      new THREE.Vector2(x + radius, y + radius),
      radius,
      Math.PI,
      3 * Math.PI / 2,
      pointsPerCorner
    );

    for (let i = 1; i < pointsPerSide; i++) {
      const t = i / pointsPerSide;
      points.push(new THREE.Vector3(x + radius + (width - 2 * radius) * t, y, 0));
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

        this.fluidRef.current.addInput(
          screenX,
          screenY,
          totalVelocityX,
          totalVelocityY
        );
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
    const frontTexture = value === "back" 
      ? textureLoader.load("/assets/black-reverse.jpg")
      : textureLoader.load(this.getCardTexturePath(value));
    
    const frontMesh = (this.mesh as THREE.Group).children[0] as THREE.Mesh;
    if (frontMesh && frontMesh.material instanceof THREE.MeshPhongMaterial) {
      frontMesh.material.map = frontTexture;
      frontMesh.material.needsUpdate = true;
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

    if (this.value === "back") {
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
          side: THREE.DoubleSide,
          shininess: 0,
          depthTest: true,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        });

      const group = this.mesh as THREE.Group;
      const [frontMesh, backMesh] = group.children as [THREE.Mesh, THREE.Mesh];

      if (frontMesh && frontMesh.material instanceof THREE.MeshPhongMaterial) {
        frontMesh.material = frontMaterial;
        frontMesh.material.needsUpdate = true;
      }

      if (backMesh && backMesh.material instanceof THREE.MeshPhongMaterial) {
        const textureLoader = new THREE.TextureLoader();
        const backMaterial = new THREE.MeshPhongMaterial({
          map: textureLoader.load("/assets/black-reverse.jpg"),
          side: THREE.DoubleSide,
          shininess: 0,
          depthTest: true,
        });
        backMesh.material = backMaterial;
        backMesh.material.needsUpdate = true;
      }
    } else if (this.frontTextureUrl) {
      const group = this.mesh as THREE.Group;
      const [frontMesh, backMesh] = group.children as [THREE.Mesh, THREE.Mesh];
      
      const loader = new THREE.TextureLoader();
      const texture = loader.load(this.frontTextureUrl);
      texture.center.set(0, 0);

      if (frontMesh && frontMesh.material instanceof THREE.MeshPhongMaterial) {
        const frontMaterial = new THREE.MeshPhongMaterial({
          map: texture,
          side: THREE.DoubleSide,
          shininess: 0,
          depthTest: true,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        });
        frontMesh.material = frontMaterial;
        frontMesh.material.needsUpdate = true;
      }

      if (backMesh && backMesh.material instanceof THREE.MeshPhongMaterial) {
        const backMaterial = new THREE.MeshPhongMaterial({
          map: loader.load("/assets/black-reverse.jpg"),
          side: THREE.DoubleSide,
          shininess: 0,
          depthTest: true,
        });
        backMesh.material = backMaterial;
        backMesh.material.needsUpdate = true;
      }
    }

    if (this.onClick) {
      this.hitbox.userData.onClick = this.onClick;
    }
  }
}
