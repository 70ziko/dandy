import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  HalfFloatType,
  OrthographicCamera,
  RGBFormat,
  RGBAFormat,
  TextureLoader,
  UnsignedByteType,
  Vector2,
  Vector4,
  WebGLRenderer,
  Texture,
} from "three";
import { AdvectionPass } from "./passes/AdvectionPass";
import { BoundaryPass } from "./passes/BoundaryPass";
import { CardTexturePass } from "./passes/CardTexturePass";
import { ColorInitPass } from "./passes/ColorInitPass";
import { CompositionPass } from "./passes/CompositionPass";
import { DivergencePass } from "./passes/DivergencePass";
import { GradientSubstractionPass } from "./passes/GradientSubstractionPass";
import { JacobiIterationsPass } from "./passes/JacobiIterationsPass";
import { TouchColorPass } from "./passes/TouchColorPass";
import { TouchForcePass } from "./passes/TouchForcePass";
import { VelocityInitPass } from "./passes/VelocityInitPass";
import { RenderTarget } from "./RenderTarget";

const gradients: string[] = ["gradient.jpg"];
const gradientTextures: Texture[] = [];

function loadGradients() {
  const textureLoader = new TextureLoader().setPath("./resources/");
  for (let i = 0; i < gradients.length; ++i) {
    textureLoader.load(gradients[i], (texture: Texture) => {
      gradientTextures[i] = texture;
    });
  }
}

loadGradients();
export interface FluidBackgroundHandle {
  addInput: (
    x: number,
    y: number,
    velocityX?: number,
    velocityY?: number
  ) => void;
  addCardInput: (
    x: number,
    y: number,
    velocityX?: number,
    velocityY?: number,
    texture?: any
  ) => void;
}

const FluidBackground = forwardRef<FluidBackgroundHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputTouchesRef = useRef<{ id: string | number; input: Vector4 }[]>([]);
  const cardInputTouchesRef = useRef<
    { id: string | number; input: Vector4; texture: any }[]
  >([]);
  const aspectRef = useRef(new Vector2(1, 1));

  useImperativeHandle(ref, () => ({
    addInput: (
      x: number,
      y: number,
      velocityX: number = 0,
      velocityY: number = 0
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const relX = (x / canvas.clientWidth) * aspectRef.current.x;
      const relY = 1.0 - y / canvas.clientHeight;

      // Scale velocity based on screen dimensions
      const relVelX = -(velocityX / canvas.clientWidth) * aspectRef.current.x;
      const relVelY = -(velocityY / canvas.clientHeight);

      if (inputTouchesRef.current.length === 0) {
        inputTouchesRef.current.push({
          id: "external",
          input: new Vector4(relX, relY, relVelX, relVelY),
        });
      } else {
        const touch = inputTouchesRef.current[0].input;
        touch.setX(relX).setY(relY).setZ(relVelX).setW(relVelY);
      }
    },
    addCardInput: (x, y, velocityX = 0, velocityY = 0, texture: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const relX = (x / canvas.clientWidth) * aspectRef.current.x;
      const relY = 1.0 - y / canvas.clientHeight;
      const relVelX = (velocityX / canvas.clientWidth) * aspectRef.current.x;
      const relVelY = -(velocityY / canvas.clientHeight);
      if (cardInputTouchesRef.current.length === 0) {
        cardInputTouchesRef.current.push({
          id: "card-external",
          input: new Vector4(relX, relY, relVelX, relVelY),
          texture: texture,
        });
      } else {
        cardInputTouchesRef.current[0].input.set(relX, relY, relVelX, relVelY);
        cardInputTouchesRef.current[0].texture = texture;
      }
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const configuration = {
        Simulate: true,
        Iterations: 16,
        Radius: 0.5,
        Scale: 0.5,
        ColorDecay: 0.02,
        Boundaries: true,
        AddColor: true,
        Visualize: "Pressure",
        Mode: "Normal",
        Timestep: "1/60",
        Reset: () => {
          velocityAdvectionPass.update({
            inputTexture: velocityInitTexture,
            velocity: velocityInitTexture,
          });
          colorAdvectionPass.update({
            inputTexture: colorInitTexture,
            velocity: velocityInitTexture,
          });
          v = undefined;
          c = undefined;
        },
      };

      const renderer = new WebGLRenderer({ canvas });
      renderer.autoClear = false;
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      // Ensure minimum dimensions to prevent NaN values
      const minDimension = 1;
      const width = Math.max(window.innerWidth, minDimension);
      const height = Math.max(window.innerHeight, minDimension);

      const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
      const dt = 1 / 60;

      const resolution = new Vector2(
        configuration.Scale * width,
        configuration.Scale * height
      );
      const aspect = new Vector2(resolution.x / resolution.y, 1.0);
      aspectRef.current = aspect;

      const velocityRT = new RenderTarget(
        resolution,
        2,
        RGBAFormat,
        HalfFloatType
      );
      const divergenceRT = new RenderTarget(
        resolution,
        1,
        RGBAFormat,
        HalfFloatType
      );
      const pressureRT = new RenderTarget(
        resolution,
        2,
        RGBAFormat,
        HalfFloatType
      );
      const colorRT = new RenderTarget(
        resolution,
        2,
        RGBFormat,
        UnsignedByteType
      );

      let v: Texture | undefined,
        c: Texture | undefined,
        d: Texture,
        p: Texture;

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
      velocityDivergencePass.material.uniforms.texelSize = {
        value: new Vector2(1.0 / resolution.x, 1.0 / resolution.y),
      };
      const pressurePass = new JacobiIterationsPass();
      const pressureSubstractionPass = new GradientSubstractionPass();
      const compositionPass = new CompositionPass();
      const cardTexturePass = new CardTexturePass(
        resolution,
        configuration.Radius
      );

      // const textureLoader = new TextureLoader().setPath("./resources/");
      // loadGradients(textureLoader);

      const handleResize = () => {
        const width = Math.max(window.innerWidth, minDimension);
        const height = Math.max(window.innerHeight, minDimension);
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        resolution.set(
          configuration.Scale * width,
          configuration.Scale * height
        );
        velocityRT.resize(resolution);
        divergenceRT.resize(resolution);
        pressureRT.resize(resolution);
        colorRT.resize(resolution);
        aspect.set(resolution.x / resolution.y, 1.0);
        aspectRef.current = aspect;
        touchForceAdditionPass.update({ aspect });
        touchColorAdditionPass.update({ aspect });
        cardTexturePass.update({ aspect });
        const texelSize = new Vector2(1.0 / resolution.x, 1.0 / resolution.y);
        velocityDivergencePass.material.uniforms.texelSize.value.copy(
          texelSize
        );
      };
      window.addEventListener("resize", handleResize);

      // Render loop.
      const render = () => {
        if (configuration.Simulate) {
          // Advect the velocity vector field.
          velocityAdvectionPass.update({ timeDelta: dt });
          v = velocityRT.set(renderer);
          renderer.render(velocityAdvectionPass.scene, camera);

          // Process input forces.
          if (inputTouchesRef.current.length > 0) {
            touchForceAdditionPass.update({
              touches: inputTouchesRef.current,
              radius: configuration.Radius,
              velocity: v,
            });
            v = velocityRT.set(renderer);
            renderer.render(touchForceAdditionPass.scene, camera);

            if (configuration.AddColor) {
              touchColorAdditionPass.update({
                touches: inputTouchesRef.current,
                radius: configuration.Radius,
                color: c,
              });
              c = colorRT.set(renderer);
              renderer.render(touchColorAdditionPass.scene, camera);
            }
          }

          // Add card texture processing
          if (cardInputTouchesRef.current.length > 0) {
            cardTexturePass.update({
              touches: cardInputTouchesRef.current,
              radius: configuration.Radius,
              velocity: v,
              cardTexture: cardInputTouchesRef.current[0].texture,
            });
            v = velocityRT.set(renderer);
            renderer.render(cardTexturePass.scene, camera);
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
            velocity: v,
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
            pressure: p,
          });
          v = velocityRT.set(renderer);
          renderer.render(pressureSubstractionPass.scene, camera);

          // Advect the color buffer.
          colorAdvectionPass.update({
            timeDelta: dt,
            inputTexture: c,
            velocity: v,
            decay: configuration.ColorDecay,
          });
          c = colorRT.set(renderer);
          renderer.render(colorAdvectionPass.scene, camera);

          // Prepare passes for next frame.
          velocityAdvectionPass.update({
            inputTexture: v,
            velocity: v,
          });
          colorAdvectionPass.update({
            inputTexture: c,
          });
        }

        renderer.setRenderTarget(null);
        let visualization: any;
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
          gradient: gradientTextures[0],
        });
        renderer.render(compositionPass.scene, camera);
      };

      let animationId: number;
      const animate = () => {
        render();
        animationId = requestAnimationFrame(animate);
      };
      animate();
      return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener("resize", handleResize);
      };
    } catch (error) {
      console.error("Error in FluidBackground useEffect:", error);
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
      }}
    />
  );
});

export default FluidBackground;
