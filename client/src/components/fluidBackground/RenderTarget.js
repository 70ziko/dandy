import { WebGLRenderTarget } from "three";

export class RenderTarget {
  index;
  buffers;

  constructor(
    resolution,
    nBuffers,
    format,
    type
  ) {
    this.index = 0;
    this.buffers = [
      {
        target: new WebGLRenderTarget(resolution.x, resolution.y, {
          format,
          type,
          depthBuffer: false,
          stencilBuffer: false
        }),
        needsResize: false
      }
    ];
    for (let i = 1; i < nBuffers; ++i) {
      this.buffers[i] = {
        target: this.buffers[0].target.clone(),
        needsResize: false
      };
    }
  }

  resize(resolution) {
    resolution.copy(resolution);
    for (let i = 0; i < this.nBuffers; ++i) {
      this.buffers[i].needsResize = true;
    }
  }

  set(renderer) {
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
