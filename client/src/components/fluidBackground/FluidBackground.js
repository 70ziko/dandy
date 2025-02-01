import React, { useRef, useEffect } from "react";
import {
  HalfFloatType,
  OrthographicCamera,
  RGBFormat,
  RGBAFormat,
  TextureLoader,
  UnsignedByteType,
  Vector2,
  Vector4,
  WebGLRenderer
} from "three";
import { AdvectionPass } from "./passes/AdvectionPass";
import { BoundaryPass } from "./passes/BoundaryPass";
import { ColorInitPass } from "./passes/ColorInitPass";
import { CompositionPass } from "./passes/CompositionPass";
import { DivergencePass } from "./passes/DivergencePass";
import { GradientSubstractionPass } from "./passes/GradientSubstractionPass";
import { JacobiIterationsPass } from "./passes/JacobiIterationsPass";
import { TouchColorPass } from "./passes/TouchColorPass";
import { TouchForcePass } from "./passes/TouchForcePass";
import { VelocityInitPass } from "./passes/VelocityInitPass";
import { RenderTarget } from "./RenderTarget";

// Gradients setup
const gradients = ["gradient.jpg"];
const gradientTextures = [];
function loadGradients(textureLoader) {
  for (let i = 0; i < gradients.length; ++i) {
    textureLoader.load(gradients[i], (texture) => {
      gradientTextures[i] = texture;
    });
  }
}

const FluidBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Remove dat.gui and Stats; keep configuration defaults.
    const configuration = {
      Simulate: true,
      Iterations: 32,
      Radius: 0.25,
      Scale: 0.5,
      ColorDecay: 0.01,
      Boundaries: true,
      AddColor: true,
      Visualize: "Color",
      Mode: "Spectral",
      Timestep: "1/60",
      Reset: () => {
        velocityAdvectionPass.update({
          inputTexture: velocityInitTexture,
          velocity: velocityInitTexture
        });
        colorAdvectionPass.update({
          inputTexture: colorInitTexture,
          velocity: velocityInitTexture
        });
        v = undefined;
        c = undefined;
      }
    };

    // Create renderer and camera.
    const renderer = new WebGLRenderer({ canvas });
    renderer.autoClear = false;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    const camera = new OrthographicCamera(0, 0, 0, 0, 0, 0);
    let dt = 1 / 60;

    // Set resolution and aspect.
    const resolution = new Vector2(
      configuration.Scale * window.innerWidth,
      configuration.Scale * window.innerHeight
    );
    const aspect = new Vector2(resolution.x / resolution.y, 1.0);

    // Initialize RenderTargets.
    const velocityRT = new RenderTarget(resolution, 2, RGBAFormat, HalfFloatType);
    const divergenceRT = new RenderTarget(resolution, 1, RGBAFormat, HalfFloatType);
    const pressureRT = new RenderTarget(resolution, 2, RGBAFormat, HalfFloatType);
    const colorRT = new RenderTarget(resolution, 2, RGBFormat, UnsignedByteType);

    // Initialize simulation variables.
    let v, c, d, p;

    // Initialize passes.
    const velocityInitPass = new VelocityInitPass(renderer, resolution);
    const velocityInitTexture = velocityInitPass.render();
    const colorInitPass = new ColorInitPass(renderer, resolution);
    const colorInitTexture = colorInitPass.render();
    const velocityAdvectionPass = new AdvectionPass(
      velocityInitTexture,
      velocityInitTexture,
      0
    );
    const colorAdvectionPass = new AdvectionPass(
      velocityInitTexture,
      colorInitTexture,
      configuration.ColorDecay
    );
    const touchForceAdditionPass = new TouchForcePass(
      resolution,
      configuration.Radius
    );
    const touchColorAdditionPass = new TouchColorPass(
      resolution,
      configuration.Radius
    );
    const velocityBoundary = new BoundaryPass();
    const velocityDivergencePass = new DivergencePass();
    const pressurePass = new JacobiIterationsPass();
    const pressureSubstractionPass = new GradientSubstractionPass();
    const compositionPass = new CompositionPass();

    // Load gradients.
    const textureLoader = new TextureLoader().setPath("./resources/");
    loadGradients(textureLoader);

    // Setup input event handling.
    let inputTouches = [];
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      resolution.set(
        configuration.Scale * window.innerWidth,
        configuration.Scale * window.innerHeight
      );
      velocityRT.resize(resolution);
      divergenceRT.resize(resolution);
      pressureRT.resize(resolution);
      colorRT.resize(resolution);
      aspect.set(resolution.x / resolution.y, 1.0);
      touchForceAdditionPass.update({ aspect });
      touchColorAdditionPass.update({ aspect });
    };
    window.addEventListener("resize", handleResize);

    const canvasRect = canvas.getBoundingClientRect();
    const getRelativeCoords = (clientX, clientY) => {
      const x = (clientX / canvas.clientWidth) * aspect.x;
      const y = 1.0 - (clientY / canvas.clientHeight);
      return { x, y };
    };

    const onMouseDown = (event) => {
      if (event.button === 0) {
        const { x, y } = getRelativeCoords(event.clientX, event.clientY);
        inputTouches.push({ id: "mouse", input: new Vector4(x, y, 0, 0) });
      }
    };
    const onMouseMove = (event) => {
      if (inputTouches.length > 0) {
        const { x, y } = getRelativeCoords(event.clientX, event.clientY);
        const touch = inputTouches[0].input;
        touch.setZ(x - touch.x).setW(y - touch.y);
        touch.setX(x).setY(y);
      }
    };
    const onMouseUp = (event) => {
      if (event.button === 0) {
        inputTouches.pop();
      }
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);

    const onTouchStart = (event) => {
      for (const touchEvent of event.changedTouches) {
        const { x, y } = getRelativeCoords(touchEvent.clientX, touchEvent.clientY);
        inputTouches.push({
          id: touchEvent.identifier,
          input: new Vector4(x, y, 0, 0)
        });
      }
    };
    const onTouchMove = (event) => {
      event.preventDefault();
      for (const touchEvent of event.changedTouches) {
        const reg = inputTouches.find(t => t.id === touchEvent.identifier);
        if (reg) {
          const { x, y } = getRelativeCoords(touchEvent.clientX, touchEvent.clientY);
          reg.input.setZ(x - reg.input.x).setW(y - reg.input.y);
          reg.input.setX(x).setY(y);
        }
      }
    };
    const onTouchEnd = (event) => {
      for (const touchEvent of event.changedTouches) {
        inputTouches = inputTouches.filter(t => t.id !== touchEvent.identifier);
      }
    };
    canvas.addEventListener("touchstart", onTouchStart);
    canvas.addEventListener("touchmove", onTouchMove);
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("touchcancel", onTouchEnd);

    // Render loop.
    function render() {
      if (configuration.Simulate) {
        // Advect the velocity vector field.
        velocityAdvectionPass.update({ timeDelta: dt });
        v = velocityRT.set(renderer);
        renderer.render(velocityAdvectionPass.scene, camera);
  
        // Process input forces.
        if (inputTouches.length > 0) {
          touchForceAdditionPass.update({
            touches: inputTouches,
            radius: configuration.Radius,
            velocity: v
          });
          v = velocityRT.set(renderer);
          renderer.render(touchForceAdditionPass.scene, camera);
  
          if (configuration.AddColor) {
            touchColorAdditionPass.update({
              touches: inputTouches,
              radius: configuration.Radius,
              color: c
            });
            c = colorRT.set(renderer);
            renderer.render(touchColorAdditionPass.scene, camera);
          }
        }
  
        // Apply velocity boundaries.
        if (configuration.Boundaries) {
          velocityBoundary.update({ velocity: v });
          v = velocityRT.set(renderer);
          renderer.render(velocityBoundary.scene, camera);
        }
  
        // Compute divergence.
        velocityDivergencePass.update({
          timeDelta: dt,
          velocity: v
        });
        d = divergenceRT.set(renderer);
        renderer.render(velocityDivergencePass.scene, camera);
  
        // Solve for pressure via Jacobi iterations.
        pressurePass.update({ divergence: d });
        for (let i = 0; i < configuration.Iterations; ++i) {
          p = pressureRT.set(renderer);
          renderer.render(pressurePass.scene, camera);
          pressurePass.update({ previousIteration: p });
        }
  
        // Subtract pressure gradient.
        pressureSubstractionPass.update({
          timeDelta: dt,
          velocity: v,
          pressure: p
        });
        v = velocityRT.set(renderer);
        renderer.render(pressureSubstractionPass.scene, camera);
  
        // Advect the color buffer.
        colorAdvectionPass.update({
          timeDelta: dt,
          inputTexture: c,
          velocity: v,
          decay: configuration.ColorDecay
        });
        c = colorRT.set(renderer);
        renderer.render(colorAdvectionPass.scene, camera);
  
        // Prepare passes for next frame.
        velocityAdvectionPass.update({
          inputTexture: v,
          velocity: v
        });
        colorAdvectionPass.update({
          inputTexture: c
        });
      }
  
      // Final composition.
      renderer.setRenderTarget(null);
      let visualization;
      switch (configuration.Visualize) {
        case "Color":
          visualization = c;
          break;
        case "Velocity":
          visualization = v;
          break;
        case "Divergence":
          visualization = d;
          break;
        case "Pressure":
          visualization = p;
          break;
        default:
          visualization = c;
          break;
      }
      compositionPass.update({
        colorBuffer: visualization,
        mode: configuration.Mode,
        gradient: gradientTextures[0]
      });
      renderer.render(compositionPass.scene, camera);
    }
  
    let animationId;
    function animate() {
      render();
      animationId = requestAnimationFrame(animate);
    }
    animate();
  
    // Cleanup on unmount.
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh"
      }}
    />
  );
};

export default FluidBackground;
