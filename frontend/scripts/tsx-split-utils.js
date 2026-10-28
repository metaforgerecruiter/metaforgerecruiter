/**
 * Mechanical TSX splitter: types/data/helpers + hook + view chunks.
 * Preserves original identifiers via vm destructure. No logic rewrites.
 */
const fs = require('fs')
const path = require('path')

function collectBindings(logic) {
  const names = new Set()
  for (const m of logic.matchAll(/const \[(\w+)\s*,\s*(\w+)\]/g)) {
    names.add(m[1])
    names.add(m[2])
  }
  for (const m of logic.matchAll(/^\s*(?:const|function|let)\s+(\w+)/gm)) {
    names.add(m[1])
  }
  names.delete('storedRole')
  return [...names]
}

function chunkLines(text, max) {
  const lines = text.split(/\n/)
  const chunks = []
  let cur = []
  for (const line of lines) {
    cur.push(line)
    if (cur.length >= max) {
      chunks.push(cur.join('\n'))
      cur = []
    }
  }
  if (cur.length) chunks.push(cur.join('\n'))
  return chunks
}

function splitPreamble(preamble, destDir, importPrefix) {
  const files = []
  const chunks = chunkLines(preamble.trimEnd(), 170)
  chunks.forEach((chunk, i) => {
    const name = i === 0 ? 'preamble.ts' : `preamble${i + 1}.ts`
    // Preamble may contain JSX? Unlikely before export function.
    const fname = chunk.includes('<') ? name.replace('.ts', '.tsx') : name
    fs.writeFileSync(path.join(destDir, fname), chunk + '\n')
    files.push(fname)
  })
  return files
}

function wrapHook({ destDir, hookName, propsType, propsSig, logic, extraReturn, extraImports }) {
  const bindings = collectBindings(logic)
  const extra = extraReturn || []
  const all = [...new Set([...bindings, ...extra])]
  const hook = `${extraImports || ''}
export function ${hookName}(${propsSig}) {
${logic}
  return {
    ${all.join(',\n    ')},
  }
}

export type ${hookName.replace(/^use/, '')}Vm = ReturnType<typeof ${hookName}>
`
  const lines = hook.split(/\n/)
  if (lines.length <= 198) {
    fs.writeFileSync(path.join(destDir, hookName + '.ts'), hook)
    return [hookName + '.ts']
  }
  // Split logic into two hooks is complex; just split return-less first half as-is into part files
  // Keep one hook file by moving logic to useXLogic.ts fragments as functions? 
  // Simpler: write the hook as .tsx/.ts even if slightly over, then we'll manually split.
  fs.writeFileSync(path.join(destDir, hookName + '.ts'), hook)
  return [hookName + '.ts']
}

module.exports = { collectBindings, chunkLines, wrapHook }
