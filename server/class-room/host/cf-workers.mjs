// Minimal stand-in for the one thing room.js and world-do.js import from the Workers runtime (local host).
export class DurableObject {
  constructor(ctx, env) {
    this.ctx = ctx
    this.env = env
  }
}
