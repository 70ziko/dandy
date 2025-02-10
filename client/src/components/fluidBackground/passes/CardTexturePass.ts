import {
    BufferAttribute,
    BufferGeometry,
    Mesh,
    RawShaderMaterial,
    Scene,
    Texture,
    Uniform,
    Vector2,
    Vector4,
    } from "three";
    
    const MAX_CARDS = 10;
    
    export class CardTexturePass {
    public readonly scene: Scene;
    private material: RawShaderMaterial;
    private mesh: Mesh;
    
    constructor(readonly resolution: Vector2, readonly radius: number) {
    this.scene = new Scene();
    
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(
        new Float32Array([
          -1, -1,
           1, -1,
           1,  1,
           1,  1,
          -1,  1,
          -1, -1,
        ]),
        2
      )
    );
    
    const uniforms: { [key: string]: Uniform } = {
      aspect: new Uniform(new Vector2(resolution.x / resolution.y, 1.0)),
      radius: new Uniform(radius),
      velocity: new Uniform(Texture.DEFAULT_IMAGE),
      cardTexture: new Uniform(Texture.DEFAULT_IMAGE),
    };
    for (let i = 0; i < MAX_CARDS; i++) {
      uniforms["input" + i] = new Uniform(new Vector4());
    }
    
    this.material = new RawShaderMaterial({
      uniforms,
      vertexShader: `
        attribute vec2 position;
        varying vec2 vUV;
        varying vec2 vScaledUV;
        uniform vec2 aspect;
        void main(){
          vUV = position * 0.5 + 0.5;
          vScaledUV = position * aspect * 0.5 + aspect * 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        precision highp int;
        varying vec2 vUV;
        varying vec2 vScaledUV;
        uniform float radius;
        uniform sampler2D velocity;
        uniform sampler2D cardTexture;
        uniform vec4 input0;
        uniform vec4 input1;
        uniform vec4 input2;
        uniform vec4 input3;
        uniform vec4 input4;
        uniform vec4 input5;
        uniform vec4 input6;
        uniform vec4 input7;
        uniform vec4 input8;
        uniform vec4 input9;
    
        // For each card input, compute a force influenced by a texture sample.
        vec2 getForce(vec4 inputVec) {
          vec2 diff = vScaledUV - inputVec.xy;
          float d = length(diff) / radius;
          // Compute UV coordinate relative to the input: [0,1] based on distance.
          vec2 uv = diff / radius + 0.5;
          float modulator = texture2D(cardTexture, uv).r;
          float strength = modulator / max(d * d, 0.01);
          strength *= clamp(dot(normalize(diff), normalize(inputVec.zw)), 0.0, 1.0);
          return strength * inputVec.zw * radius;
        }
    
        void main(){
          vec4 force = vec4(0.0);
          force.xy += getForce(input0);
          force.xy += getForce(input1);
          force.xy += getForce(input2);
          force.xy += getForce(input3);
          force.xy += getForce(input4);
          force.xy += getForce(input5);
          force.xy += getForce(input6);
          force.xy += getForce(input7);
          force.xy += getForce(input8);
          force.xy += getForce(input9);
    
          gl_FragColor = texture2D(velocity, vUV) + force;
        }
      `,
      depthTest: false,
      depthWrite: false,
    });
    
    this.mesh = new Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
    }
    
    public update(uniforms: any): void {
    if (uniforms.aspect !== undefined) {
    this.material.uniforms.aspect.value = uniforms.aspect;
    }
    if (uniforms.touches !== undefined) {
    const touchMax = Math.min(MAX_CARDS, uniforms.touches.length);
    for (let i = 0; i < touchMax; i++) {
    this.material.uniforms["input" + i].value = uniforms.touches[i].input;
    }
    for (let i = uniforms.touches.length; i < MAX_CARDS; i++) {
    this.material.uniforms["input" + i].value.set(0, 0, 0, 0);
    }
    }
    if (uniforms.radius !== undefined) {
    this.material.uniforms.radius.value = uniforms.radius;
    }
    if (uniforms.velocity !== undefined) {
    this.material.uniforms.velocity.value = uniforms.velocity;
    }
    if (uniforms.cardTexture !== undefined) {
    this.material.uniforms.cardTexture.value = uniforms.cardTexture;
    }
    }
    }