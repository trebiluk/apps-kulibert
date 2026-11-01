// Maps the one Workers-runtime import (cloudflare:workers) to a plain-Node stand-in, so src/ runs unchanged.
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'cloudflare:workers') return { url: new URL('./cf-workers.mjs', import.meta.url).href, shortCircuit: true }
  return nextResolve(specifier, context)
}
