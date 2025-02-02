import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Hand } from './components/Hand';

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
  isHovered: boolean;
  hover: () => void;
  unhover: () => void;
  resetPosition: () => void;
}

const CardGame: React.FC<Props> = ({ numCards = 5 }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneRefs | null>(null);
  const handRef = useRef<Hand | null>(null);
  const animationFrameRef = useRef<number | void>(null);

  useEffect(() => {
    const mountElement = mountRef.current;
    if (!mountElement) return;

    const cleanupScene = () => {
      if (sceneRef.current) {
        const { scene, renderer } = sceneRef.current;
        
        // Clean up hand
        if (handRef.current) {
          handRef.current.remove();
          handRef.current = null;
        }

        // Dispose of scene objects
        scene.traverse((object: THREE.Object3D) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            } else if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            }
          }
        });

        // Clean up renderer
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        renderer.dispose();
        sceneRef.current = null;
      }
    };

    cleanupScene();

    const setup = (): void => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      const renderer = new THREE.WebGLRenderer({ antialias: true });

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x1a1a1a);
      mountElement.appendChild(renderer.domElement);

      const tableGeometry = new THREE.PlaneGeometry(20, 20);
      const tableMaterial = new THREE.MeshStandardMaterial({
        color: 0x004400,
        side: THREE.DoubleSide,
      });
      const table = new THREE.Mesh(tableGeometry, tableMaterial);
      table.rotation.x = -Math.PI * 0.5;
      table.position.y = -5;
      scene.add(table);

      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(0, 5, 5);
      scene.add(directionalLight);

      camera.position.set(0, 3, 10);
      camera.lookAt(0, -3, 0);
      sceneRef.current = { scene, camera, renderer };
    };

    const handleResize = () => {
      if (!sceneRef.current) return;
      const { camera, renderer } = sceneRef.current;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const setupRaycaster = () => {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let lastRaycastTime = 0;

      const onMouseMove = (event: MouseEvent) => {
        if (!handRef.current || !sceneRef.current) return;
        
        // Throttle raycaster calculations
        if (event.timeStamp - lastRaycastTime < 16) return; // ~60fps
        lastRaycastTime = event.timeStamp;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, sceneRef.current.camera);

        // Get all hitboxes at once for better performance
        const hitboxes = (handRef.current as any).cards.map((card: Card) => card.hitbox);
        const intersects = raycaster.intersectObjects(hitboxes, false);

        (handRef.current as any).cards.forEach((card: Card) => {
          const isIntersected = intersects.some(intersect => intersect.object === card.hitbox);
          if (isIntersected && !card.isHovered) {
            card.hover();
          } else if (!isIntersected && card.isHovered) {
            card.unhover();
            card.resetPosition();
          }
        });
      };

      window.addEventListener('mousemove', onMouseMove);
      return () => window.removeEventListener('mousemove', onMouseMove);
    };

    setup();

    if (!sceneRef.current) return;
    handRef.current = new Hand({
      scene: sceneRef.current.scene,
      numCards,
      tablePosition: new THREE.Vector3(0, -6, 5)
    });

    const cleanupRaycaster = setupRaycaster();
    window.addEventListener('resize', handleResize);

    // Render loop
    const animate = () => {
      if (!sceneRef.current) return;

      gsap.updateRoot(Date.now() / 1000);
      sceneRef.current.renderer.render(
        sceneRef.current.scene,
        sceneRef.current.camera
      );
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      cleanupScene();
      window.removeEventListener('resize', handleResize);
      cleanupRaycaster();
    };
  }, [numCards]);

  return <div ref={mountRef} className="w-full h-screen" />;
};

export default CardGame;
