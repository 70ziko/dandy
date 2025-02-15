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

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        logarithmicDepthBuffer: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setClearColor(0x000000, 0);
    } catch (error) {
      console.error("Failed to initialize WebGL renderer:", error);
      return;
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    const scene = new THREE.Scene();
    scene.matrixWorldAutoUpdate = true;

    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.name = "camera";
    camera.position.set(0, 0, 5);
    camera.updateMatrix();
    camera.updateMatrixWorld();

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let mouseDownTime = 0;
    const mouseDownPosition = new THREE.Vector2();
    let potentialCard: GuiCard | null = null;
    const clickThreshold = 0.02; // threshold in normalized device coordinates
    const timeThreshold = 200; // milliseconds

    const menuCards: GuiCard[] = [];
    try {
      menuCards.push(
        new GuiCard({
          scene,
          alt: "PLAY",
          onClick: () => {
            navigate("/game");
          },
          position: new THREE.Vector3(-1, -0.5, 0),
          rotation: new THREE.Euler(0, 0, 0),
          fluidRef: fluidRef as React.RefObject<FluidBackgroundHandle>,
        })
      );

      menuCards.push(
        new GuiCard({
          scene,
          alt: "Private Rooms",
          onClick: () => {
            console.log("Private Rooms clicked");
          },
          position: new THREE.Vector3(1, -0.5, 0),
          rotation: new THREE.Euler(0, 0, 0),
          fluidRef: fluidRef as React.RefObject<FluidBackgroundHandle>,
        })
      );
    } catch (error) {
      console.error("Error creating menu cards:", error);
    }
    // menuCards.forEach((card, index) => {
    //   gsap.to(card.getMeshPosition(), { y: -1.5, duration: 1.5, delay: 0.5 + index * 0.2, ease: "power2.out" });
    // });

    // Add 3D text "DANDY"
    const fontLoader = new FontLoader();
    fontLoader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        const textGeometry = new TextGeometry("DANDY", {
          font,
          size: 0.5,
          depth: 0.1,
          curveSegments: 12,
          bevelEnabled: false,
        });
        textGeometry.computeBoundingBox();
        const bbox = textGeometry.boundingBox;
        if (bbox) {
          const centerOffset = new THREE.Vector3(
            -(bbox.max.x - bbox.min.x) / 2,
            -(bbox.max.y - bbox.min.y) / 2,
            -(bbox.max.z - bbox.min.z) / 2
          );
          textGeometry.translate(
            centerOffset.x,
            centerOffset.y,
            centerOffset.z
          );
        }
        const textMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(0, 2, 0);
        scene.add(textMesh);
        gsap.to(textMesh.position, {
          y: 1.5,
          duration: 1.5,
          ease: "power2.out",
        });
        gsap.to(textMesh.position, {
          y: "+=0.2",
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    );

    let draggedCard: GuiCard | null = null;

    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);
    scene.add(camera);

    const updateMousePosition = (event: MouseEvent | TouchEvent) => {
      let clientX, clientY;

      if (event instanceof MouseEvent) {
        clientX = event.clientX;
        clientY = event.clientY;
      } else {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleStart = (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      updateMousePosition(event);
      mouseDownTime = performance.now();
      mouseDownPosition.set(mouse.x, mouse.y);
      raycaster.setFromCamera(mouse, camera);
      potentialCard = null;
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const card of menuCards) {
        const hitboxIntersect = intersects.find(
          (intersect) => intersect.object === card.getHitbox()
        );
        if (hitboxIntersect) {
          potentialCard = card;
          break;
        }
      }
    };

    const handleMove = (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      updateMousePosition(event);
      raycaster.setFromCamera(mouse, camera);

      if (potentialCard && !draggedCard) {
        const dx = mouse.x - mouseDownPosition.x;
        const dy = mouse.y - mouseDownPosition.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > clickThreshold) {
          const intersects = raycaster.intersectObject(
            potentialCard.getHitbox()
          );
          if (intersects.length > 0) {
            draggedCard = potentialCard;
            potentialCard.startDrag(intersects[0].point);
            potentialCard = null;
          }
        }
      }

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

    const handleEnd = () => {
      if (potentialCard && !draggedCard) {
        const elapsed = performance.now() - mouseDownTime;
        if (elapsed < timeThreshold && potentialCard.onClick) {
          potentialCard.onClick();
        }
        potentialCard = null;
      }
      if (draggedCard) {
        draggedCard.endDrag();
        draggedCard = null;
      }
    };

    renderer.domElement.addEventListener("mousedown", handleStart);
    renderer.domElement.addEventListener("mousemove", handleMove);
    renderer.domElement.addEventListener("mouseup", handleEnd);

    renderer.domElement.addEventListener("touchstart", handleStart, {
      passive: false,
    });
    renderer.domElement.addEventListener("touchmove", handleMove, {
      passive: false,
    });
    renderer.domElement.addEventListener("touchend", handleEnd, {
      passive: false,
    });

    const animate = () => {
      requestAnimationFrame(animate);
      try {
        scene.updateMatrixWorld();
        camera.updateMatrixWorld();
        renderer.render(scene, camera);
      } catch (error) {
        console.error("Render error:", error);
      }
    };

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousedown", handleStart);
      renderer.domElement.removeEventListener("mousemove", handleMove);
      renderer.domElement.removeEventListener("mouseup", handleEnd);

      renderer.domElement.removeEventListener("touchstart", handleStart);
      renderer.domElement.removeEventListener("touchmove", handleMove);
      renderer.domElement.removeEventListener("touchend", handleEnd);

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) {
            object.geometry.dispose();
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
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
