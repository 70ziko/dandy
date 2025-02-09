import {
  Texture,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
  TextureDataType,
} from "three";

interface IBuffer {
  target: WebGLRenderTarget;
  needsResize: boolean;
}

export class RenderTarget {
  private index: number;
  private buffers: IBuffer[];

  constructor(
    readonly resolution: Vector2,
    readonly nBuffers: number,
    readonly format: number,
    readonly type: number
  ) {
    this.index = 0;
    this.buffers = [
      {
        target: (() => {
          const rt = new WebGLRenderTarget(resolution.x, resolution.y, {
            format,
            type: type as TextureDataType,
            depthBuffer: false,
            stencilBuffer: false,
          });
          // For 3D textures, disable flipY and premultiplyAlpha (as required by WebGL specs).
          // THREE.Data3DTexture is imported from "three".
          if (type === (rt.texture.constructor as any).Data3DTexture) {
            rt.texture.flipY = false;
            rt.texture.premultiplyAlpha = false;
          }
          return rt;
        })(),
        needsResize: false,
      },
    ];
    for (let i = 1; i < nBuffers; ++i) {
      const clonedTarget = this.buffers[0].target.clone();
      if (type === (clonedTarget.texture.constructor as any).Data3DTexture) {
        clonedTarget.texture.flipY = false;
        clonedTarget.texture.premultiplyAlpha = false;
      }
      this.buffers[i] = {
        target: clonedTarget,
        needsResize: false,
      };
    }
  }

  public resize(resolution: Vector2): void {
    resolution.copy(resolution);
    for (let i = 0; i < this.nBuffers; ++i) {
      this.buffers[i].needsResize = true;
    }
  }

  public set(renderer: WebGLRenderer): Texture {
    const buffer = this.buffers[this.index++];
    if (buffer.needsResize) {
      buffer.needsResize = false;
      buffer.target.setSize(this.resolution.x, this.resolution.y);
    }
    renderer.setRenderTarget(buffer.target);
    this.index %= this.nBuffers;
    return buffer.target.texture;
  }
}
