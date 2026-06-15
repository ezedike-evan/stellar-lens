#!/usr/bin/env node
/**
 * Guards documentation examples against API drift.
 *
 * Scans every ```ts / ```typescript code block in the docs for imports from
 * `stellar-lens` and verifies each imported symbol is actually exported by the
 * SDK (parsed from packages/sdk/src/index.ts). If the SDK renames or removes an
 * export, the docs fail CI instead of silently shipping a broken example.
 *
 *   pnpm docs:test
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sdkIndex = join(root, 'packages/sdk/src/index.ts')
const contentDir = join(root, 'packages/demo/content')

/** Collect every exported symbol from the SDK barrel (values + types). */
function sdkExports() {
  const src = readFileSync(sdkIndex, 'utf8')
  const names = new Set()
  for (const m of src.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/)[0].trim()
      if (name) names.add(name)
    }
  }
  return names
}

/** Recursively list .md files. */
function mdFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry)
    return statSync(p).isDirectory() ? mdFiles(p) : p.endsWith('.md') ? [p] : []
  })
}

const exported = sdkExports()
const violations = []
let blocks = 0
let imports = 0

for (const file of mdFiles(contentDir)) {
  const md = readFileSync(file, 'utf8')
  const rel = file.slice(root.length + 1)

  for (const fence of md.matchAll(/```(?:ts|typescript)\n([\s\S]*?)```/g)) {
    blocks++
    const code = fence[1]
    for (const imp of code.matchAll(
      /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]stellar-lens['"]/g,
    )) {
      for (const part of imp[1].split(',')) {
        const name = part.trim().split(/\s+as\s+/)[0].trim()
        if (!name) continue
        imports++
        if (!exported.has(name)) {
          violations.push(`${rel}: imports "${name}" which is not exported by stellar-lens`)
        }
      }
    }
  }
}

console.log(
  `docs:test — scanned ${blocks} code block(s), verified ${imports} import(s) against ${exported.size} SDK exports`,
)

if (violations.length) {
  console.error(`\n${violations.length} broken reference(s):\n  ${violations.join('\n  ')}`)
  process.exit(1)
}
console.log('All documented imports resolve to real SDK exports.')
