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
import Stats from "stats.js";
import * as dat from "dat.gui";

interface TouchInput {
  id: string | number;
  input: Vector4;
}

const gradients: string[] = ["gradient.jpg"];
const gradientTextures: any[] = [];
loadGradients();

// App configuration options.
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
  },
  Github: () => {
    window.open("https://github.com/amsXYZ/three-fluid-sim");
  },
  Twitter: () => {
    window.open("https://twitter.com/_amsXYZ");
  }
};

// Html/Three.js initialization.
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
if (!canvas || !canvas.parentElement) {
  throw new Error("Canvas element or its parent not found");
}
const stats = new Stats();
canvas.parentElement.appendChild(stats.dom);
const gui = new dat.GUI();

initGUI();

const renderer = new WebGLRenderer({ canvas });
renderer.autoClear = false;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
const camera = new OrthographicCamera(0, 0, 0, 0, 0, 0);
let dt = 1 / 60;

// Check floating point texture support.
if (
  !(
    renderer.getContext().getExtension("OES_texture_half_float") &&
    renderer.getContext().getExtension("OES_texture_half_float_linear")
  )
) {
  alert("This demo is not supported on your device.");
}

const resolution = new Vector2(
  configuration.Scale * window.innerWidth,
  configuration.Scale * window.innerHeight
);
const aspect = new Vector2(resolution.x / resolution.y, 1.0);

// RenderTargets initialization.
const velocityRT = new RenderTarget(resolution, 2, RGBAFormat, HalfFloatType);
const divergenceRT = new RenderTarget(resolution, 1, RGBAFormat, HalfFloatType);
const pressureRT = new RenderTarget(resolution, 2, RGBAFormat, HalfFloatType);
const colorRT = new RenderTarget(resolution, 2, RGBFormat, UnsignedByteType);

// Variables to store render pass results.
let c: any;
let v: any;
let d: any;
let p: any;

// Render passes initialization.
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

// Event listeners (resizing and mouse/touch input).
window.addEventListener("resize", (event: UIEvent) => {
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
});

window.addEventListener("keyup", (event: KeyboardEvent) => {
  if (event.keyCode === 72) {
    stats.dom.hidden = !stats.dom.hidden;
  }
});

let inputTouches: TouchInput[] = [];
canvas.addEventListener("mousedown", (event: MouseEvent) => {
  if (event.button === 0) {
    const x = (event.clientX / canvas.clientWidth) * aspect.x;
    const y = 1.0 - (event.clientY + window.scrollY) / canvas.clientHeight;
    inputTouches.push({
      id: "mouse",
      input: new Vector4(x, y, 0, 0)
    });
  }
});
canvas.addEventListener("mousemove", (event: MouseEvent) => {
  if (inputTouches.length > 0) {
    const x = (event.clientX / canvas.clientWidth) * aspect.x;
    const y = 1.0 - (event.clientY + window.scrollY) / canvas.clientHeight;
    inputTouches[0].input
      .setZ(x - inputTouches[0].input.x)
      .setW(y - inputTouches[0].input.y);
    inputTouches[0].input.setX(x).setY(y);
  }
});
canvas.addEventListener("mouseup", (event: MouseEvent) => {
  if (event.button === 0) {
    inputTouches.pop();
  }
});

canvas.addEventListener("touchstart", (event: TouchEvent) => {
  for (let i = 0; i < event.changedTouches.length; i++) {
    const touch = event.changedTouches.item(i);
    if (touch) {
      const x = (touch.clientX / canvas.clientWidth) * aspect.x;
      const y = 1.0 - (touch.clientY + window.scrollY) / canvas.clientHeight;
      inputTouches.push({
        id: touch.identifier,
        input: new Vector4(x, y, 0, 0)
      });
    }
  }
});

canvas.addEventListener("touchmove", (event: TouchEvent) => {
  event.preventDefault();
  for (let i = 0; i < event.changedTouches.length; i++) {
    const touch = event.changedTouches.item(i);
    if (touch) {
      const registeredTouch = inputTouches.find(value => value.id === touch.identifier);
      if (registeredTouch) {
        const x = (touch.clientX / canvas.clientWidth) * aspect.x;
        const y = 1.0 - (touch.clientY + window.scrollY) / canvas.clientHeight;
        registeredTouch.input
          .setZ(x - registeredTouch.input.x)
          .setW(y - registeredTouch.input.y);
        registeredTouch.input.setX(x).setY(y);
      }
    }
  }
});

canvas.addEventListener("touchend", (event: TouchEvent) => {
  for (let i = 0; i < event.changedTouches.length; i++) {
    const touch = event.changedTouches.item(i);
    if (touch) {
      inputTouches = inputTouches.filter(value => value.id !== touch.identifier);
    }
  }
});

canvas.addEventListener("touchcancel", (event: TouchEvent) => {
  for (let i = 0; i < inputTouches.length; ++i) {
    let found = false;
    for (let j = 0; j < event.touches.length; ++j) {
      const touch = event.touches.item(j);
      if (touch && inputTouches[i].id === touch.identifier) {
        found = true;
        break;
      }
    }
    if (!found) {
      inputTouches.splice(i, 1);
      i--;
    }
  }
});

// Dat.GUI configuration.
function loadGradients(): void {
  const textureLoader = new TextureLoader().setPath("./resources/");
  for (let i = 0; i < gradients.length; ++i) {
    textureLoader.load(gradients[i], (texture) => {
      gradientTextures[i] = texture;
    });
  }
}

function initGUI(): void {
  const sim = gui.addFolder("Simulation");
  sim
    .add(configuration, "Scale", 0.1, 2.0, 0.1)
    .onFinishChange((value: number) => {
      resolution.set(
        configuration.Scale * window.innerWidth,
        configuration.Scale * window.innerHeight
      );
      velocityRT.resize(resolution);
      divergenceRT.resize(resolution);
      pressureRT.resize(resolution);
      colorRT.resize(resolution);
    });
  sim.add(configuration, "Iterations", 16, 128, 1);
  sim.add(configuration, "ColorDecay", 0.0, 0.1, 0.01);
  sim
    .add(configuration, "Timestep", ["1/15", "1/30", "1/60", "1/90", "1/120"])
    .onChange((value: string) => {
      switch (value) {
        case "1/15":
          dt = 1 / 15;
          break;
        case "1/30":
          dt = 1 / 30;
          break;
        case "1/60":
          dt = 1 / 60;
          break;
        case "1/90":
          dt = 1 / 90;
          break;
        case "1/120":
          dt = 1 / 120;
          break;
        default:
          dt = 1 / 60;
          break;
      }
    });
  sim.add(configuration, "Simulate");
  sim.add(configuration, "Boundaries");
  sim.add(configuration, "Reset");

  const input = gui.addFolder("Input");
  input.add(configuration, "Radius", 0.1, 1, 0.1);
  input.add(configuration, "AddColor");

  gui.add(configuration, "Visualize", [
    "Color",
    "Velocity",
    "Divergence",
    "Pressure"
  ]);
  gui.add(configuration, "Mode", [
    "Normal",
    "Luminance",
    "Spectral",
    "Gradient"
  ]);

  const github = gui.add(configuration, "Github");
  (github as any).__li.className = "guiIconText";
  (github as any).__li.style.borderLeft = "3px solid #8C8C8C";
  const githubIcon = document.createElement("span");
  githubIcon.className = "guiIcon github";
  github.domElement.parentElement && github.domElement.parentElement.appendChild(githubIcon);

  const twitter = gui.add(configuration, "Twitter");
  (twitter as any).__li.className = "guiIconText";
  (twitter as any).__li.style.borderLeft = "3px solid #8C8C8C";
  const twitterIcon = document.createElement("span");
  twitterIcon.className = "guiIcon twitter";
  twitter.domElement.parentElement && twitter.domElement.parentElement.appendChild(twitterIcon);
}

// Render loop.
function render(): void {
  if (configuration.Simulate) {
    // Advect the velocity vector field.
    velocityAdvectionPass.update({ timeDelta: dt });
    v = velocityRT.set(renderer);
    renderer.render(velocityAdvectionPass.scene, camera);

    // Add external forces/colors according to input.
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

    // Add velocity boundaries (simulation walls).
    if (configuration.Boundaries) {
      velocityBoundary.update({ velocity: v });
      v = velocityRT.set(renderer);
      renderer.render(velocityBoundary.scene, camera);
    }

    // Compute the divergence of the advected velocity vector field.
    velocityDivergencePass.update({
      timeDelta: dt,
      velocity: v
    });
    d = divergenceRT.set(renderer);
    renderer.render(velocityDivergencePass.scene, camera);

    // Compute the pressure gradient of the advected velocity vector field using jacobi iterations.
    pressurePass.update({ divergence: d });
    for (let i = 0; i < configuration.Iterations; ++i) {
      p = pressureRT.set(renderer);
      renderer.render(pressurePass.scene, camera);
      pressurePass.update({ previousIteration: p });
    }

    // Subtract the pressure gradient to obtain a divergence-free velocity vector field.
    pressureSubstractionPass.update({
      timeDelta: dt,
      velocity: v,
      pressure: p
    });
    v = velocityRT.set(renderer);
    renderer.render(pressureSubstractionPass.scene, camera);

    // Advect the color buffer with the divergence-free velocity vector field.
    colorAdvectionPass.update({
      timeDelta: dt,
      inputTexture: c,
      velocity: v,
      decay: configuration.ColorDecay
    });
    c = colorRT.set(renderer);
    renderer.render(colorAdvectionPass.scene, camera);

    // Feed the input of the advection passes with the last advected results.
    velocityAdvectionPass.update({
      inputTexture: v,
      velocity: v
    });
    colorAdvectionPass.update({
      inputTexture: c
    });
  }

  // Render to the main framebuffer the desired visualization.
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
    gradient: gradientTextures[0]
  });
  renderer.render(compositionPass.scene, camera);
}

function animate(): void {
  requestAnimationFrame(animate);
  stats.begin();
  render();
  stats.end();
}
animate();
