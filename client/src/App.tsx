import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import FluidBackground from 'components/fluidBackground/FluidBackground';
import CardGame from 'game';
import { GuiCard } from 'game/components/Card';

const ScenePage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Create a GuiCard instance with alt "PLAY" and onClick redirect to /game
    new GuiCard({
      scene,
      alt: 'PLAY',
      frontTexture: '/assets/black-reverse.jpg',
      onClick: () => {
        navigate('/game');
      },
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
    });

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
    };
  }, [navigate]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <FluidBackground />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ScenePage />} />
        <Route path="/game" element={<CardGame />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
