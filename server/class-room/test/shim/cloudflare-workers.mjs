// Minimal stand-in for the one thing room.js imports from the Workers runtime.
export class DurableObject {
  constructor(ctx, env) {
    this.ctx = ctx
    this.env = env
  }
}
