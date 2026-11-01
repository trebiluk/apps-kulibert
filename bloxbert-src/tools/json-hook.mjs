// Lets a check import src modules that `import x from '../assets/foo.json'` without an import attribute
// (esbuild allows it in the build; Node 22 does not). Use: node --import ./tools/json-hook.mjs tools/some-check.mjs
import { register } from 'node:module'
register('data:text/javascript,' + encodeURIComponent(`
export async function load(url, context, next) {
  if (url.endsWith('.json')) return next(url, { ...context, importAttributes: { type: 'json' } })
  return next(url, context)
}
`), import.meta.url)
