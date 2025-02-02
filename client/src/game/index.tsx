import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Hand } from './components/Hand';

const CardGame = ({ numCards = 5 }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const handRef = useRef(null);
  const animationFrameRef = useRef();

  useEffect(() => {
    const mountElement = mountRef.current;

    const cleanupScene = () => {
      if (sceneRef.current) {
        if (handRef.current) {
          handRef.current.remove();
          handRef.current = null;
        }
        const { renderer } = sceneRef.current;
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        renderer.dispose();
        sceneRef.current = null;
      }
    };

    cleanupScene();

    const setup = () => {
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
      if (mountElement) {
        mountElement.appendChild(renderer.domElement);
      }

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
      const { camera, renderer } = sceneRef.current;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const setupRaycaster = () => {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const onMouseMove = (event) => {
        if (!handRef.current) return;
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, sceneRef.current.camera);

        handRef.current.cards.forEach((card) => {
          const intersects = raycaster.intersectObject(card.hitbox);
          if (intersects.length > 0 && !card.isHovered) {
            card.hover();
          } else if (intersects.length === 0 && card.isHovered) {
            card.unhover();
            card.resetPosition();
          }
        });
      };

      window.addEventListener('mousemove', onMouseMove);
      return () => window.removeEventListener('mousemove', onMouseMove);
    };

    setup();

    handRef.current = new Hand(sceneRef.current.scene, numCards, new THREE.Vector3(0, -6, 5));

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
