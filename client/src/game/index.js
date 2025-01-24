import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Card } from './components/Card';
import gsap from 'gsap';

const CardGame = ({ numCards = 8 }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cardsRef = useRef([]);
  const animationFrameRef = useRef();

  useEffect(() => {
    if (sceneRef.current) {
      cardsRef.current.forEach(card => card.remove());
      cardsRef.current = [];
      const { renderer } = sceneRef.current;
      mountRef.current?.removeChild(renderer.domElement);
    }

    const setup = () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x1a1a1a);
      mountRef.current.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(0, 1, 2);
      scene.add(directionalLight);

      camera.position.z = 5;
      sceneRef.current = { scene, camera, renderer };
    };

    const spawnCards = () => {
      cardsRef.current.forEach(card => card.remove());
      cardsRef.current = [];
      
      const fanRadius = 3;
      const fanSpread = Math.PI / 4;
      const centerAngle = Math.PI / 2;
      const zOffset = 0.1; 

      for (let i = 0; i < numCards; i++) {
        const angle = centerAngle + fanSpread * (i / (numCards - 1) - 0.5);
        const xPos = Math.cos(angle) * fanRadius;
        const yPos = Math.sin(angle) * fanRadius - 4;
        const zPos = i * zOffset; 
        
        const position = new THREE.Vector3(xPos, yPos, zPos);
        const rotation = new THREE.Euler(0, 0, angle + Math.PI / 2);
        
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
      let hoveredCard = null;

      const onMouseMove = (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, sceneRef.current.camera);
        const intersects = raycaster.intersectObjects(
          cardsRef.current.map(card => card.mesh)
        );

        if (intersects.length > 0) {
          const newHoveredCard = cardsRef.current.find(
            card => card.mesh === intersects[0].object
          );
          
          if (hoveredCard !== newHoveredCard) {            
            if (hoveredCard) {
              hoveredCard.unhover();
              cardsRef.current.forEach(card => card.resetPosition());
            }
            
            newHoveredCard.hover();
            
            const hoveredIndex = cardsRef.current.indexOf(newHoveredCard);
            cardsRef.current.forEach((card, i) => {
              if (card !== newHoveredCard) {
                const direction = i < hoveredIndex ? 1 : -1;
                const distance = Math.abs(i - hoveredIndex);
                card.spreadFrom(newHoveredCard.mesh.position, direction, 0.3 * distance);
              }
            });
            
            hoveredCard = newHoveredCard;
          }
        } else if (hoveredCard) {
          hoveredCard.unhover();
          cardsRef.current.forEach(card => card.resetPosition());
          hoveredCard = null;
        }
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
      cardsRef.current.forEach(card => card.remove());
      cardsRef.current = [];
      if (sceneRef.current?.renderer) {
        mountRef.current?.removeChild(sceneRef.current.renderer.domElement);
      }
      window.removeEventListener('resize', handleResize);
      cleanupRaycaster();
    };
  }, [numCards]); 

  return <div ref={mountRef} className="w-full h-screen" />;
};

export default CardGame;