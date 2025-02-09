import React, { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import * as THREE from "three";
import FluidBackground, {
  FluidBackgroundHandle,
} from "components/fluidBackground";
import CardGame from "game";
import { GuiCard } from "game/components/Card";

const ScenePage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fluidRef = useRef<FluidBackgroundHandle>(null);
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
    camera.name = "camera";
    camera.position.z = 5;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const menuCards: GuiCard[] = [
      new GuiCard({
        scene,
        alt: "PLAY",
        // frontTexture: '/assets/black-reverse.jpg',
        onClick: () => {
          navigate("/game");
        },
        position: new THREE.Vector3(-1, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
        fluidRef: fluidRef as React.RefObject<FluidBackgroundHandle>,
      }),
      new GuiCard({
        scene,
        alt: "Private Rooms",
        onClick: () => {},
        position: new THREE.Vector3(1, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
        fluidRef: fluidRef as React.RefObject<FluidBackgroundHandle>,
      }),
    ];

    let draggedCard: GuiCard | null = null;

    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);
    scene.add(camera);

    const updateMousePosition = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onMouseMove = (event: MouseEvent) => {
      updateMousePosition(event);
      raycaster.setFromCamera(mouse, camera);

      if (draggedCard) {
        const dragPosition = new THREE.Vector3();
        const distance = draggedCard
          .getMeshPosition()
          .distanceTo(camera.position);
        raycaster.ray.at(distance, dragPosition);
        draggedCard.drag(dragPosition);
        return;
      }

      const intersects = raycaster.intersectObjects(scene.children, true);
      for (const card of menuCards) {
        const isHovering = intersects.some(
          (intersect) => intersect.object === card.getHitbox()
        );
        if (isHovering) {
          card.hover();
        } else {
          card.unhover();
        }
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      updateMousePosition(event);
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      for (const card of menuCards) {
        const hitboxIntersect = intersects.find(
          (intersect) => intersect.object === card.getHitbox()
        );

        if (hitboxIntersect) {
          draggedCard = card;
          card.startDrag(hitboxIntersect.point);
        }
      }
    };

    const onMouseUp = () => {
      if (draggedCard) {
        draggedCard.endDrag();
        draggedCard = null;
      }
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
      renderer.dispose();
    };
  }, [navigate]);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <FluidBackground ref={fluidRef} />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          pointerEvents: "auto",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
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
