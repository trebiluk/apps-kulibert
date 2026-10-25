// Lets plain Node import src/room.js, which imports 'cloudflare:workers'.
// Used only by the in-process simulation test:  node --import ./test/shim/register.mjs --test test/room.sim.test.mjs
import { register } from 'node:module'
register('./hooks.mjs', import.meta.url)
