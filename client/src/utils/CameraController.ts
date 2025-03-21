import * as THREE from "three";

export class CameraController {
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private enabled: boolean = false;
  
  private moveSpeed: number = 0.1;
  private rotateSpeed: number = 0.005;
  
  private isRightMouseDown: boolean = false;
  private prevMouseX: number = 0;
  private prevMouseY: number = 0;
  private center: THREE.Vector3;
  private radius: number;

  constructor(camera: THREE.Camera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.center = new THREE.Vector3(0, -3, 0); 
    this.radius = this.camera.position.distanceTo(this.center);
    
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;

    window.addEventListener('keydown', this.handleKeyDown);
    this.domElement.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);

    console.log('Camera controls enabled - Use arrow keys to move, right-click to rotate');
  }

  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;

    window.removeEventListener('keydown', this.handleKeyDown);
    this.domElement.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);

    console.log('Camera controls disabled');
  }

  dispose(): void {
    this.disable();
  }

  // Handle keyboard movement
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;

    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    const right = new THREE.Vector3().crossVectors(direction, this.camera.up);

    switch (event.key) {
      case 'ArrowUp':
        this.camera.position.add(direction.multiplyScalar(this.moveSpeed));
        this.center.add(direction.multiplyScalar(this.moveSpeed));
        break;
      case 'ArrowDown':
        this.camera.position.sub(direction.normalize().multiplyScalar(this.moveSpeed));
        this.center.sub(direction.normalize().multiplyScalar(this.moveSpeed));
        break;
      case 'ArrowLeft':
        this.camera.position.sub(right.normalize().multiplyScalar(this.moveSpeed));
        this.center.sub(right.normalize().multiplyScalar(this.moveSpeed));
        break;
      case 'ArrowRight':
        this.camera.position.add(right.normalize().multiplyScalar(this.moveSpeed));
        this.center.add(right.normalize().multiplyScalar(this.moveSpeed));
        break;
    }

    this.camera.lookAt(this.center);
  }

  private handleMouseDown(event: MouseEvent): void {
    if (!this.enabled || event.button !== 2) return; // Right mouse button only
    
    event.preventDefault();
    this.isRightMouseDown = true;
    this.prevMouseX = event.clientX;
    this.prevMouseY = event.clientY;

    // Prevent context menu on right-click
    this.domElement.addEventListener('contextmenu', this.preventContextMenu);
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.enabled || !this.isRightMouseDown) return;

    const deltaX = event.clientX - this.prevMouseX;
    const deltaY = event.clientY - this.prevMouseY;

    const angleX = deltaX * this.rotateSpeed;
    const angleY = deltaY * this.rotateSpeed;

    // Update camera position in spherical coordinates
    const offset = this.camera.position.clone().sub(this.center);
    const spherical = new THREE.Spherical().setFromVector3(offset);

    // Apply the rotation
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + angleY));
    spherical.theta += angleX;

    // Convert back to Cartesian coordinates
    offset.setFromSpherical(spherical);
    this.camera.position.copy(this.center).add(offset);
    this.camera.lookAt(this.center);

    this.prevMouseX = event.clientX;
    this.prevMouseY = event.clientY;
  }

  private handleMouseUp(): void {
    if (!this.enabled) return;
    this.isRightMouseDown = false;
    this.domElement.removeEventListener('contextmenu', this.preventContextMenu);
  }

  private preventContextMenu(event: Event): void {
    event.preventDefault();
  }
}
