// STUB - cannon-es is NOT vendored yet.
// Job 1.7.0 asked for cannon-es (MIT, pmndrs/cannon-es) as its own ES-module import with its LICENSE file.
// The build sandbox could not download it (npm, jsdelivr, unpkg and raw.githubusercontent were unreachable;
// the GitHub archive was refused by the network policy). RepoCoder adds the real file in the build commit:
//   replace this file with dist/cannon-es.js from the cannon-es release, and add vendor/cannon-es-LICENSE (MIT).
// Until then the game does not import this file. The touch level runs on ../physics.js, a small fixed-step
// stand-in (1/120 s step, accumulator, at most 4 steps per frame, no random numbers) with the same contract.
// To switch: load this module with <script type="module">, hand its World/Body classes to a thin adapter
// that exposes create / step / senses / clone like physics.js, and keep the rules above.
export const CANNON_VENDORED = false;
export default null;
