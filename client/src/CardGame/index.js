import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const CardGame = ({ numCards = 5 }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x1a1a1a);
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 2);
    scene.add(directionalLight);

    const cards = [];
    const cardGeometry = new THREE.PlaneGeometry(1, 1.618);
    const textureLoader = new THREE.TextureLoader();
    const cardTexture = textureLoader.load('https://threejsfundamentals.org/threejs/resources/images/wall.jpg');
    const cardMaterial = new THREE.MeshStandardMaterial({ 
      map: cardTexture,
      side: THREE.DoubleSide
    });

    const fanRadius = 3;
    const fanSpread = Math.PI / 4;
    const centerAngle = Math.PI / 2;

    for (let i = 0; i < numCards; i++) {
      const card = new THREE.Mesh(cardGeometry, cardMaterial);
      
      const angle = centerAngle + fanSpread * (i / (numCards - 1) - 0.5);
      const xPos = Math.cos(angle) * fanRadius;
      const yPos = Math.sin(angle) * fanRadius;
      
      card.position.set(xPos, yPos - 2, 0); // Changed to move up instead of down
      card.rotation.z = angle + Math.PI / 2;
      
      cards.push(card);
      scene.add(card);
    }

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      cards.forEach((card, index) => {
        card.position.y += Math.sin(Date.now() * 0.001 + index * 0.5) * 0.001;
      });
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const mount = mountRef.current;
    return () => {
      mount?.removeChild(renderer.domElement);
      window.removeEventListener('resize', handleResize);
    };
  }, [numCards]);

  return <div ref={mountRef} className="w-full h-screen" />;
};

export default CardGame;
