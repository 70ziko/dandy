import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Card } from './components/Card';
import gsap from 'gsap';

const CardGame = ({ numCards = 5 }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cardsRef = useRef([]);
  const animationFrameRef = useRef();

  useEffect(() => {
    const mountElement = mountRef.current;

    const cleanupScene = () => {
      if (sceneRef.current) {
        cardsRef.current.forEach(card => card.remove());
        cardsRef.current = [];
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
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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

    const calculateFanProperties = (numCards) => {
      const fanRadius = 1.5 + ((numCards + 1) * 0.1);
      
      const maxSpread = Math.PI * 2/3; // 120 degrees
      const minSpread = Math.PI / 6;   // 22.5 degrees
      const fanSpread = Math.min(maxSpread, minSpread + (numCards * 0.1));
      
      const zOffset = Math.max(0.01, 0.05 - (numCards * 0.002));
      
      return { fanRadius, fanSpread, zOffset };
    };

    const spawnCards = () => {
      cardsRef.current.forEach(card => card.remove());
      cardsRef.current = [];
      
      const { fanRadius, fanSpread, zOffset } = calculateFanProperties(numCards);
      const centerAngle = Math.PI / 2;

      for (let i = 0; i < numCards; i++) {
        const angle = centerAngle + fanSpread * (i / (numCards - 1) - 0.5);
        const xPos = Math.cos(angle) * fanRadius;
        const yPos = (Math.sin(angle) * fanRadius) - 6;
        const zPos = (i * zOffset) + 5;
        
        const position = new THREE.Vector3(xPos, yPos, zPos);
        const rotation = new THREE.Euler(-Math.PI * 0.2, 0, angle + Math.PI / 2);
        
        const card = new Card(sceneRef.current.scene, position, rotation);
        cardsRef.current.push(card);
      }
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
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, sceneRef.current.camera);
        
        cardsRef.current.forEach(card => {
          const intersects = raycaster.intersectObject(card.hitbox);
          
          if (intersects.length > 0 && !card.isHovered) {
            card.hover();
            // const hoveredIndex = cardsRef.current.indexOf(card);
            // cardsRef.current.forEach((otherCard, i) => {
            //   if (otherCard !== card) {
            //     const direction = i < hoveredIndex ? 1 : -1;
            //     const distance = Math.abs(i - hoveredIndex);
            //     otherCard.spreadFrom(card.mesh.position, direction, 0.5 * distance);
            //   }
            // });
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
    spawnCards();
    const cleanupRaycaster = setupRaycaster();
    window.addEventListener('resize', handleResize);

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
