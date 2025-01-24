// CardGame.js
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { Card } from './components/Card';

const CardGame = ({ numCards = 5 }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
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
      const fanRadius = 3;
      const fanSpread = Math.PI / 4;
      const centerAngle = Math.PI / 2;

      for (let i = 0; i < numCards; i++) {
        const angle = centerAngle + fanSpread * (i / (numCards - 1) - 0.5);
        const xPos = Math.cos(angle) * fanRadius;
        const yPos = Math.sin(angle) * fanRadius - 2;
        
        const position = new THREE.Vector3(xPos, yPos, 0);
        const rotation = new THREE.Euler(0, 0, angle + Math.PI / 2);
        
        const card = new Card(sceneRef.current.scene, position, rotation);
        cardsRef.current.push(card);
      }
    };

    const animate = () => {
      requestAnimationFrame(animate);
      TWEEN.update();
      cardsRef.current.forEach((card, index) => {
        card.animate(Date.now(), index);
      });
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
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
            
            // Spread other cards
            const hoveredIndex = cardsRef.current.indexOf(newHoveredCard);
            cardsRef.current.forEach((card, i) => {
              if (card !== newHoveredCard) {
                const direction = i < hoveredIndex ? -1 : 1;
                const distance = Math.abs(i - hoveredIndex);
                card.spreadFrom(newHoveredCard.mesh.position, direction, 0.3 * distance);
              }
            });
            
            hoveredCard = newHoveredCard;
          }
        } else if (hoveredCard) {
          hoveredCard.unhover();
          hoveredCard = null;
        }
      };

      window.addEventListener('mousemove', onMouseMove);
      return () => window.removeEventListener('mousemove', onMouseMove);
    };

    setup();
    spawnCards();
    animate();
    const cleanupRaycaster = setupRaycaster();
    window.addEventListener('resize', handleResize);

    return () => {
      cardsRef.current.forEach(card => card.remove());
      cardsRef.current = [];
      const { renderer } = sceneRef.current;
      mountRef.current?.removeChild(renderer.domElement);
      window.removeEventListener('resize', handleResize);
      cleanupRaycaster();
    };
  }, [numCards]);

  return <div ref={mountRef} className="w-full h-screen" />;
};

export default CardGame;