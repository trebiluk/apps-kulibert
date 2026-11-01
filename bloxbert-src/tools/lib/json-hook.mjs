// Lets the pure Node checks import game source that does `import X from '../assets/....json'` with no import attribute.
// The game build (esbuild) accepts that; Node 22 refuses it (ERR_IMPORT_ATTRIBUTE_MISSING). Inside the checks only, such a
// JSON file is loaded as a module whose default export is the parsed JSON. The game's own imports are not changed.
// Use: `import './lib/json-hook.mjs'` first, then `await import()` the source modules.
import { register } from 'node:module'

register('data:text/javascript,' + encodeURIComponent(`
import { readFile } from 'node:fs/promises'
export async function load(url, context, next) {
  if (url.endsWith('.json') && !(context.importAttributes && context.importAttributes.type)) {
    const text = await readFile(new URL(url), 'utf8')
    return { format: 'module', source: 'export default ' + JSON.stringify(JSON.parse(text)) + ';', shortCircuit: true }
  }
  return next(url, context)
}
`))
