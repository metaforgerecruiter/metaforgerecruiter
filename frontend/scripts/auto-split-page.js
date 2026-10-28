const fs = require('fs')
const path = require('path')

function linesOf(file) {
  return fs.readFileSync(file, 'utf8').split(/\n/)
}

function collectBindings(logic) {
  const names = new Set()
  for (const m of logic.matchAll(/const \[(\w+)\s*,\s*(\w+)\]/g)) {
    names.add(m[1])
    names.add(m[2])
  }
  for (const m of logic.matchAll(/^\s*(?:const|function|let)\s+(\w+)/gm)) {
    names.add(m[1])
  }
  return [...names]
}

function collectPropNames(sig) {
  const inner = sig.replace(/^[^{]*\{/, '').replace(/\}[\s\S]*$/, '')
  const names = []
  for (const part of inner.split(',')) {
    const t = part.trim()
    if (!t) continue
    const m = t.match(/^(?:[\w.]+\:\s*)?(\w+)/) || t.match(/^(\w+)/)
    if (m) {
      const n = t.includes(':') ? t.split(':')[0].trim().split(/\s+/).pop() : m[1]
      // handle `recruiter: initialRecruiter`
      if (t.includes(':') && !t.includes('=')) {
        const lhs = t.split(':')[0].trim()
        names.push(lhs)
      } else {
        const lhs = t.split('=')[0].trim()
        if (lhs.includes(':')) names.push(lhs.split(':')[0].trim())
        else names.push(lhs)
      }
    }
  }
  return names.filter(Boolean)
}

function lucideNames(src) {
  const m = src.match(/from 'lucide-react'/)
  if (!m) return []
  const before = src.slice(0, src.indexOf("from 'lucide-react'"))
  const brace = before.lastIndexOf('{')
  if (brace < 0) return []
  return before
    .slice(brace + 1)
    .split(',')
    .map(s => s.trim().split(/\s+as\s+/))
    .filter(a => a[0])
    .map(a => ({ orig: a[0].trim(), alias: (a[1] || a[0]).trim() }))
    .filter(a => a.orig && !a.orig.startsWith('//'))
}

function usedFromList(chunk, names) {
  return names.filter(n => new RegExp('(?:^|[^\\w])' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:[^\\w]|$)').test(chunk))
}

function exportizePreamble(preamble) {
  return preamble
    .replace(/^interface /gm, 'export interface ')
    .replace(/^type /gm, 'export type ')
    .replace(/^const /gm, 'export const ')
    .replace(/^function /gm, 'export function ')
    .replace(/^export export /gm, 'export ')
}

function splitText(text, max) {
  const ls = text.split(/\n/)
  const out = []
  let cur = []
  for (const line of ls) {
    if (cur.length >= max && (line.trim() === '' || line.trim().startsWith('export ') || line.trim().startsWith('const ') || line.trim().startsWith('{'))) {
      out.push(cur.join('\n'))
      cur = [line]
    } else {
      cur.push(line)
    }
  }
  if (cur.length) out.push(cur.join('\n'))
  return out
}

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true })
}

function write(p, c) {
  fs.writeFileSync(p, c.replace(/\s+$/, '\n'))
  const n = c.split(/\n/).length
  if (n > 200) console.log('OVER 200', n, p)
  else console.log('ok', n, path.basename(p))
}

function relImport(fromFile, toFile) {
  let rel = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, '/')
  if (!rel.startsWith('.')) rel = './' + rel
  return rel.replace(/\.tsx?$/, '')
}

function splitPage(cfg) {
  const srcText = fs.readFileSync(cfg.src, 'utf8')
  const srcLines = srcText.split(/\n/)
  ensureDir(cfg.destDir)

  const fnLine = cfg.fnLine - 1
  const preamble = srcLines.slice(0, fnLine).join('\n')
  const fnSrc = srcLines.slice(fnLine).join('\n')

  // Extract signature: from export function Name( through the closing `) {` of params
  const sigMatch = fnSrc.match(/^export function (\w+)\(([\s\S]*?)\) \{/)
  if (!sigMatch) throw new Error('Cannot parse function signature for ' + cfg.fnName)
  const fnName = sigMatch[1]
  const propsInner = sigMatch[2].trim()
  const afterSig = fnSrc.slice(sigMatch[0].length)

  // Logic is until cfg.logicEndLine (absolute)
  const logicAbsStart = cfg.fnLine
  const logic = srcLines.slice(logicAbsStart, cfg.logicEndLine).join('\n')
  // The first line after signature is already inside function; logic should be the body without the signature
  // srcLines[fnLine] is `export function...` which may span multiple lines
  const sigLineCount = sigMatch[0].split(/\n/).length
  const logicBody = srcLines.slice(fnLine + sigLineCount, cfg.logicEndLine).join('\n')

  const lucide = lucideNames(srcText)
  const lucideAliases = lucide.map(x => x.alias)

  // Preamble files
  const preExp = exportizePreamble(preamble)
  const preChunks = splitText(preExp, 175)
  const preFiles = []
  preChunks.forEach((chunk, i) => {
    const isTsx = chunk.includes('<') && /return \(|className=/.test(chunk)
    const fname = (i === 0 ? 'preamble' : 'preamble' + (i + 1)) + (isTsx ? '.tsx' : '.ts')
    write(path.join(cfg.destDir, fname), chunk + '\n')
    preFiles.push(fname)
  })

  const propNames = collectPropNames(propsInner)
  const bindings = collectBindings(logicBody)
  const returnNames = [...new Set([...propNames, ...bindings, ...(cfg.extraReturn || [])])]

  const propsType = cfg.propsType || 'any'
  const hookImports = cfg.hookImports || `import { ${propsType} } from './preamble'\n`

  // Split logic body if needed
  const hookHead = `${hookImports}export function ${cfg.hookName}(${propsInner}) {\n`
  const hookTail = `\n  return {\n    ${returnNames.join(',\n    ')},\n  }\n}\n\nexport type ${cfg.vmType} = ReturnType<typeof ${cfg.hookName}>\n`
  let hookContent = hookHead + logicBody + hookTail
  const hookPath = path.join(cfg.destDir, cfg.hookName + '.ts')
  if (hookContent.split(/\n/).length > 200) {
    // split logicBody roughly in half at a blank line after 90 lines
    const lbs = logicBody.split(/\n/)
    let splitAt = Math.min(120, Math.floor(lbs.length / 2))
    for (let i = splitAt; i < lbs.length - 10; i++) {
      if (lbs[i].trim() === '') { splitAt = i; break }
    }
    const part1 = lbs.slice(0, splitAt).join('\n')
    const part2 = lbs.slice(splitAt).join('\n')
    const b1 = collectBindings(part1)
    const stateHook = `${hookImports}export function ${cfg.hookName}State(${propsInner}) {\n${part1}\n  return {\n    ${[...new Set([...propNames, ...b1])].join(',\n    ')},\n  }\n}\nexport type ${cfg.vmType}State = ReturnType<typeof ${cfg.hookName}State>\n`
    write(path.join(cfg.destDir, cfg.hookName + 'State.ts'), stateHook)

    const handlers = `import { ${cfg.vmType}State } from './${cfg.hookName}State'\n\nexport function ${cfg.hookName}Handlers(s: ${cfg.vmType}State) {\n  const {\n    ${[...new Set([...propNames, ...b1])].join(',\n    ')},\n  } = s\n${part2}\n  return {\n    ${collectBindings(part2).join(',\n    ')},\n  }\n}\n`
    write(path.join(cfg.destDir, cfg.hookName + 'Handlers.ts'), handlers)

    hookContent = `import { ${cfg.hookName}State } from './${cfg.hookName}State'\nimport { ${cfg.hookName}Handlers } from './${cfg.hookName}Handlers'\n\nexport function ${cfg.hookName}(${propsInner}) {\n  const s = ${cfg.hookName}State(${propNames.join(', ')})\n  const h = ${cfg.hookName}Handlers(s)\n  return { ...s, ...h }\n}\n\nexport type ${cfg.vmType} = ReturnType<typeof ${cfg.hookName}>\n`
    // Fix call - need to pass the original props object not exploded names incorrectly
    hookContent = `import { ${cfg.hookName}State } from './${cfg.hookName}State'\nimport { ${cfg.hookName}Handlers } from './${cfg.hookName}Handlers'\n\nexport function ${cfg.hookName}(props: Parameters<typeof ${cfg.hookName}State>[0]) {\n  const s = ${cfg.hookName}State(props as any)\n  const h = ${cfg.hookName}Handlers(s)\n  return { ...s, ...h }\n}\n\nexport type ${cfg.vmType} = ReturnType<typeof ${cfg.hookName}>\n`
    // The State hook uses destructured params, not a single props object. Keep same signature.
    hookContent = `import { ${cfg.hookName}State } from './${cfg.hookName}State'\nimport { ${cfg.hookName}Handlers } from './${cfg.hookName}Handlers'\n\nexport function ${cfg.hookName}(${propsInner}) {\n  const s = ${cfg.hookName}State(${rebuildCall(propsInner)})\n  const h = ${cfg.hookName}Handlers(s)\n  return { ...s, ...h }\n}\n\nexport type ${cfg.vmType} = ReturnType<typeof ${cfg.hookName}>\n`
  }
  write(hookPath, hookContent)

  // Views
  const desture = `  const {\n    ${returnNames.join(',\n    ')},\n  } = vm\n`
  cfg.views.forEach((v, i) => {
    const jsx = srcLines.slice(v.from - 1, v.to).join('\n')
    const usedLucide = lucide.filter(x => usedFromList(jsx, [x.alias]))
    const lucideImp = usedLucide.length
      ? `import { ${usedLucide.map(x => x.orig === x.alias ? x.orig : x.orig + ' as ' + x.alias).join(', ')} } from 'lucide-react'\n`
      : ''
    const extraImp = (cfg.viewImports || []).join('\n') + (cfg.viewImports && cfg.viewImports.length ? '\n' : '')
    let body
    if (v.wrap === 'return') {
      body = `  return (\n${jsx}\n  )\n`
    } else if (v.wrap === 'raw') {
      body = jsx + '\n'
    } else {
      body = `  return (\n    <>\n${jsx}\n    </>\n  )\n`
    }
    const content = `import React from 'react'\n${lucideImp}${extraImp}import { ${cfg.vmType} } from './${cfg.hookName}'\n\nexport function ${v.name}({ vm }: { vm: ${cfg.vmType} }) {\n${desture}${v.guard || ''}${body}}\n`
    write(path.join(cfg.destDir, v.name + '.tsx'), content)
  })

  // Composer
  const viewImps = cfg.views.map(v => `import { ${v.name} } from './${v.name}'`).join('\n')
  const branches = (cfg.composerBody || `  return <${cfg.views[cfg.views.length - 1].name} vm={vm} />\n`)
  const composer = `import React from 'react'\nimport { ${cfg.hookName} } from './${cfg.hookName}'\n${cfg.propsType ? `import { ${cfg.propsType} } from './preamble'\n` : ''}${viewImps}\n\nexport function ${fnName}(${propsInner}) {\n  const vm = ${cfg.hookName}(${rebuildCall(propsInner)})\n${branches}}\n`
  write(path.join(cfg.destDir, fnName + 'View.tsx'), composer)

  // Original re-export
  const publics = cfg.publicExports || [`export { ${fnName} } from './${path.basename(cfg.destDir)}/${fnName}View'\n`]
  write(cfg.src, publics.join('\n') + '\n')
}

function rebuildCall(propsInner) {
  // Call hook with same destructure by passing a reconstructed object... 
  // Easier: the hook has the same param signature, so call with the same local names.
  const names = collectPropNames(propsInner)
  // If original is destructured, the composer function also destructures, so we can pass the same names:
  // useX({ a, b, c }) if hook expects destructure... hooks expect the same destructure pattern so we should call:
  // useX({ ... }) building object from local names.
  const obj = names.map(n => {
    // handle rename recruiter: initialRecruiter in original - collectPropNames may be wrong
    return n
  })
  return obj.map(n => n).join(', ').includes(':') 
    ? `{ ${obj.join(', ')} }`
    : `{ ${obj.map(n => n).join(', ')} }`
}

module.exports = { splitPage, collectBindings, collectPropNames, lucideNames, exportizePreamble, splitText }
