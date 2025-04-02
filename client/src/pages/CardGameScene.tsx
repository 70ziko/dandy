import gsap from "gsap";
import * as THREE from "three";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { Hand } from "../components/Hand";
import { Deck } from "../components/Deck";
import { useGuest } from "../contexts/GuestContext";
import { api } from "../services/api";
import type { SceneRefs, CardGameSceneProps, Card, CardValue } from "../types";
import { CameraController } from "../utils/CameraController";

gsap.registerPlugin(MotionPathPlugin);

type GameParams = Record<'tableId', string | undefined>;

// Interface for the droppable area where cards can be laid
interface DroppableArea {
  mesh: THREE.Mesh;
  isHovered: boolean;
}

const CardGame: React.FC<CardGameSceneProps> = () => {
  const [_cameraControlsEnabled, setCameraControlsEnabled] = useState(false);
  const cameraControllerRef = useRef<CameraController | null>(null);
  const { tableId } = useParams<GameParams>();
  const { guestId } = useGuest();
  const [error, setError] = useState<string | null>(null);
  const [cardValues, setCardValues] = useState<CardValue[]>([]);
  const droppableAreaRef = useRef<DroppableArea | null>(null);

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneRefs | null>(null);
  const handRef = useRef<Hand | null>(null);
  const animationFrameRef = useRef<number | void>(null);

  const throwCardsHandler = useCallback(() => {
    if (handRef.current) {
      handRef.current.throwCards();
    }
  }, []);

  const toggleHandHoldingHandler = useCallback(() => {
    if (handRef.current) {
      handRef.current.toggleHolding();
    }
  }, []);

  useEffect(() => {
    console.log('tableId:', tableId);
    console.log('guestId:', guestId);
    if (!tableId || !guestId) {
      setError('Table ID and Guest ID are required to join the game');
      return;
    }

    const initializeGame = async () => {
      try {
        await api.joinGame(tableId);
        
        const cards = await api.drawCards(tableId);
        setCardValues(cards);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize game');
      }
    };

    initializeGame();

    return () => {
      if (tableId) {
        api.leaveGame(tableId).catch(console.error);
      }
    };
  }, [tableId, guestId]);

  useEffect(() => {
    const mountElement = mountRef.current;
    if (!mountElement) return;

    const cleanupScene = () => {
      if (sceneRef.current) {
        const { scene, renderer } = sceneRef.current;

        if (handRef.current) {
          handRef.current.remove();
          handRef.current = null;
        }

        scene.traverse((object: THREE.Object3D) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            } else if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            }
          }
        });

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

      const tableGeometry = new THREE.PlaneGeometry(32, 32);
      const tableMaterial = new THREE.MeshStandardMaterial({
        color: 0x004400,
        side: THREE.DoubleSide,
      });
      const table = new THREE.Mesh(tableGeometry, tableMaterial);
      table.rotation.x = -Math.PI / 2;
      table.position.y = -5;
      scene.add(table);

      const droppableAreaGeometry = new THREE.PlaneGeometry(2, 3);
      const droppableAreaMaterial = new THREE.MeshStandardMaterial({
        color: 0x888800,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const droppableAreaMesh = new THREE.Mesh(droppableAreaGeometry, droppableAreaMaterial);
      droppableAreaMesh.rotation.x = -Math.PI / 2;
      droppableAreaMesh.position.set(0, -4.9, 8);
      scene.add(droppableAreaMesh);
      droppableAreaRef.current = { mesh: droppableAreaMesh, isHovered: false };

      new Deck({ scene, position: new THREE.Vector3(0, -4.87, 0) });

      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(0, 5, 5);
      scene.add(directionalLight);

      camera.position.set(0, 2.46, 15.5);
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
      let draggedCard: Card | null = null;

      const updateMousePosition = (event: MouseEvent) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      };

      const onMouseMove = (event: MouseEvent) => {
        if (!sceneRef.current) return;
        updateMousePosition(event);

        if (droppableAreaRef.current && !draggedCard) {
          raycaster.setFromCamera(mouse, sceneRef.current.camera);
          const intersects = raycaster.intersectObject(droppableAreaRef.current.mesh, false);
          const wasHovered = droppableAreaRef.current.isHovered;
          droppableAreaRef.current.isHovered = intersects.length > 0;
          
          if (wasHovered !== droppableAreaRef.current.isHovered) {
            const material = droppableAreaRef.current.mesh.material as THREE.MeshStandardMaterial;
            material.opacity = droppableAreaRef.current.isHovered ? 0.8 : 0.5;
            material.color.set(droppableAreaRef.current.isHovered ? 0xaaaa00 : 0x888800);
            material.needsUpdate = true;
          }
        }

        if (!handRef.current) return;

        if (draggedCard) {
          raycaster.setFromCamera(mouse, sceneRef.current.camera);
          const dragPosition = new THREE.Vector3();
          const distance = draggedCard.mesh.position.distanceTo(
            sceneRef.current.camera.position
          );
          raycaster.ray.at(distance, dragPosition);
          draggedCard.drag(dragPosition);

          if (droppableAreaRef.current) {
            const intersects = raycaster.intersectObject(droppableAreaRef.current.mesh, false);
            droppableAreaRef.current.isHovered = intersects.length > 0;
            const material = droppableAreaRef.current.mesh.material as THREE.MeshStandardMaterial;
            material.opacity = droppableAreaRef.current.isHovered ? 0.8 : 0.5;
            material.needsUpdate = true;
          }

          return;
        }

        if (event.timeStamp - lastRaycastTime < 16) return; // Throttle to ~60fps
        lastRaycastTime = event.timeStamp;

        raycaster.setFromCamera(mouse, sceneRef.current.camera);
        const hitboxes = (handRef.current as any).cards.map(
          (card: Card) => card.hitbox
        );
        const intersects = raycaster.intersectObjects(hitboxes, false);

        (handRef.current as any).cards.forEach((card: Card) => {
          const isIntersected = intersects.some(
            (intersect) => intersect.object === card.hitbox
          );
          if (isIntersected && !card.isHovered) {
            card.hover();
          } else if (!isIntersected && card.isHovered) {
            card.unhover();
            card.resetPosition();
          }
        });
      };

      const onMouseDown = (event: MouseEvent) => {
        if (!handRef.current || !sceneRef.current) return;
        updateMousePosition(event);

        raycaster.setFromCamera(mouse, sceneRef.current.camera);
        const hitboxes = (handRef.current as any).cards.map(
          (card: Card) => card.hitbox
        );
        const intersects = raycaster.intersectObjects(hitboxes, false);

        if (intersects.length > 0) {
          const intersected = intersects[0];
          const cards = (handRef.current as any).cards;
          const card = cards.find((c: Card) => c.hitbox === intersected.object);
          if (card) {
            draggedCard = card;
            card.startDrag(intersected.point);
          }
        }
      };

      const onMouseUp = (event: MouseEvent) => {
        if (draggedCard) {
          draggedCard.endDrag();
          draggedCard = null;
          return;
        }
        
        // Handle click on droppable area when no card is being dragged
        if (droppableAreaRef.current) {
          updateMousePosition(event);
          raycaster.setFromCamera(mouse, sceneRef.current!.camera);
          const intersects = raycaster.intersectObject(droppableAreaRef.current.mesh);
          
          if (intersects.length > 0) {
            toggleHandHoldingHandler();
          }
        }
      };

      const onTouchStart = (event: TouchEvent) => {
        event.preventDefault();
        if (!handRef.current || !sceneRef.current) return;
        const touch = event.touches[0];
        mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, sceneRef.current.camera);
        const hitboxes = (handRef.current as any).cards.map(
          (card: Card) => card.hitbox
        );
        const intersects = raycaster.intersectObjects(hitboxes, false);
        if (intersects.length > 0) {
          const intersected = intersects[0];
          const cards = (handRef.current as any).cards;
          const card = cards.find((c: Card) => c.hitbox === intersected.object);
          if (card) {
            draggedCard = card;
            card.startDrag(intersected.point);
          }
        }
      };

      const onTouchMove = (event: TouchEvent) => {
        event.preventDefault();
        if (!handRef.current || !sceneRef.current) return;
        const touch = event.touches[0];
        mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        if (draggedCard) {
          raycaster.setFromCamera(mouse, sceneRef.current.camera);
          const dragPosition = new THREE.Vector3();
          const distance = draggedCard.mesh.position.distanceTo(
            sceneRef.current.camera.position
          );
          raycaster.ray.at(distance, dragPosition);
          draggedCard.drag(dragPosition);

          // Check if dragged card is over droppable area
          if (droppableAreaRef.current) {
            const intersects = raycaster.intersectObject(droppableAreaRef.current.mesh, false);
            droppableAreaRef.current.isHovered = intersects.length > 0;
            const material = droppableAreaRef.current.mesh.material as THREE.MeshStandardMaterial;
            material.opacity = droppableAreaRef.current.isHovered ? 0.8 : 0.5;
            material.needsUpdate = true;
          }

          return;
        }
        if (event.timeStamp - lastRaycastTime < 16) return;
        lastRaycastTime = event.timeStamp;
        raycaster.setFromCamera(mouse, sceneRef.current.camera);
        const hitboxes = (handRef.current as any).cards.map(
          (card: Card) => card.hitbox
        );
        const intersects = raycaster.intersectObjects(hitboxes, false);
        (handRef.current as any).cards.forEach((card: Card) => {
          const isIntersected = intersects.some(
            (intersect) => intersect.object === card.hitbox
          );
          if (isIntersected && !card.isHovered) {
            card.hover();
          } else if (!isIntersected && card.isHovered) {
            card.unhover();
            card.resetPosition();
          }
        });
      };

      const onTouchEnd = (event: TouchEvent) => {
        event.preventDefault();
        if (draggedCard) {
          draggedCard.endDrag();
          draggedCard = null;
        }
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("touchstart", onTouchStart);
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("touchend", onTouchEnd);

      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
      };
    };

    setup();

    if (!sceneRef.current) return;
    
    // Initialize camera controller
    if (sceneRef.current.renderer.domElement) {
      cameraControllerRef.current = new CameraController(
        sceneRef.current.camera,
        sceneRef.current.renderer.domElement
      );
    }
    console.log(cardValues);
    handRef.current = new Hand({
      scene: sceneRef.current.scene,
      cardValues,
      holdingPosition: new THREE.Vector3(0, -4, 10),
    });
    console.log("handRef.current:", handRef.current);

    const cleanupRaycaster = setupRaycaster();
    window.addEventListener("resize", handleResize);

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
      if (cameraControllerRef.current) {
        cameraControllerRef.current.dispose();
      }
      cleanupScene();
      window.removeEventListener("resize", handleResize);
      cleanupRaycaster();
    };
  }, [cardValues]);

  const onkeydown = useCallback((event: KeyboardEvent) => {
    if (event.key.toUpperCase() === "C") {
      throwCardsHandler();
    } else if (event.key.toUpperCase() === "H") {
      toggleHandHoldingHandler();
    } else if (event.key.toUpperCase() === "D") {
      // Toggle debug camera controls
      setCameraControlsEnabled(prev => {
        if (cameraControllerRef.current) {
          if (!prev) {
            cameraControllerRef.current.enable();
          } else {
            cameraControllerRef.current.disable();
          }
        }
        return !prev;
      });
    }
  }, [throwCardsHandler, toggleHandHoldingHandler]);

  useEffect(() => {
    window.addEventListener("keydown", onkeydown);

    return () => {
      window.removeEventListener("keydown", onkeydown);
    };
  }, [onkeydown]);

  if (error) {
    return <div>{error}</div>;
  }

  return <div ref={mountRef} className="w-full h-screen" />;
};

export default CardGame;
