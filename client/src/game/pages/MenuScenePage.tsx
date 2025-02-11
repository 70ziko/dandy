import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { gsap } from "gsap";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import FluidBackground, {
  FluidBackgroundHandle,
} from "components/fluidBackground";
import { GuiCard } from "game/components/Card";

const MenuScenePage: React.FC = () => {
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
        position: new THREE.Vector3(-1, -0.5, 0),
        rotation: new THREE.Euler(0, 0, 0),
        fluidRef: fluidRef as React.RefObject<FluidBackgroundHandle>,
      }),
      new GuiCard({
        scene,
        alt: "Private Rooms",
        onClick: () => {},
        position: new THREE.Vector3(1, -0.5, 0),
        rotation: new THREE.Euler(0, 0, 0),
        fluidRef: fluidRef as React.RefObject<FluidBackgroundHandle>,
      }),
    ];
    // Animate cards into position
    // menuCards.forEach((card, index) => {
    //   gsap.to(card.getMeshPosition(), { y: -1.5, duration: 1.5, delay: 0.5 + index * 0.2, ease: "power2.out" });
    // });
    
    // Add 3D text "DANDY"
    const fontLoader = new FontLoader();
    fontLoader.load("https://threejs.org/examples/fonts/helvetiker_regular.typeface.json", (font) => {
      const textGeometry = new TextGeometry("DANDY", {
        font,
        size: 0.5,
        // height: 0.2,
        curveSegments: 2,
        bevelEnabled: false,
      });
      const textMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(-1, 1, 0);
      scene.add(textMesh);
      gsap.to(textMesh.position, { y: 1.5, duration: 1.5, ease: "power2.out" });
      gsap.to(textMesh.position, { y: "+=0.2", duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut" });
    });
    
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

export default MenuScenePage;
