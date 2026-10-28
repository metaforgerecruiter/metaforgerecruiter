const fs = require('fs')
const path = require('path')

function deepenImports(s) {
  return s
    .replace(/from '((?:\.\.\/)+)/g, (_, dots) => `from '${dots}../`)
    .replace(/from '\.\//g, "from '../")
}

function exportize(preamble) {
  return preamble
    .replace(/^interface /gm, 'export interface ')
    .replace(/^type /gm, 'export type ')
    .replace(/^const /gm, 'export const ')
    .replace(/^function /gm, 'export function ')
    .replace(/^export export /gm, 'export ')
}

function collectTopFns(logic) {
  const names = []
  for (const m of logic.matchAll(/^  const (\w+) = /gm)) names.push(m[1])
  for (const m of logic.matchAll(/^  function (\w+)/gm)) names.push(m[1])
  return names
}

function formatList(names, indent = '    ', perLine = 4) {
  if (!names.length) return indent + 'ok: true as const'
  const lines = []
  for (let i = 0; i < names.length; i += perLine) {
    const slice = names.slice(i, i + perLine).join(', ')
    lines.push(indent + slice + (i + perLine < names.length ? ',' : ''))
  }
  return lines.join('\n')
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

function collectPropNames(destructure) {
  const names = []
  const body = destructure.replace(/[{}]/g, '')
  for (const raw of body.split(',')) {
    const t = raw.trim()
    if (!t || t.startsWith('//')) continue
    const noDefault = t.split('=')[0].trim()
    if (noDefault.includes(':')) {
      const [left, right] = noDefault.split(':').map(s => s.trim())
      // recruiter: initialRecruiter  OR  role = with type in sig not here
      if (/^[A-Z<{]/.test(right) || right.includes('|') || right.includes('[')) {
        names.push(left)
      } else {
        names.push(left)
      }
    } else {
      names.push(noDefault)
    }
  }
  return names.filter(n => n && /^[A-Za-z_]/.test(n))
}

function usedNames(chunk, all) {
  return all.filter(n => new RegExp('(?:^|[^\\w])' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:$|[^\\w])').test(chunk))
}

function lucideFrom(src) {
  const idx = src.indexOf("from 'lucide-react'")
  if (idx < 0) return []
  const brace = src.lastIndexOf('{', idx)
  return src
    .slice(brace + 1, idx)
    .split(',')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('//'))
    .map(s => {
      const p = s.split(/\s+as\s+/)
      return { orig: p[0].trim(), alias: (p[1] || p[0]).trim() }
    })
    .filter(x => x.orig && /^[A-Za-z]/.test(x.orig))
}

function write(p, c) {
  const text = c.replace(/\s+$/, '\n')
  fs.writeFileSync(p, text)
  const n = text.split(/\n/).length
  console.log((n > 200 ? 'OVER ' : 'ok   ') + String(n).padStart(3), path.relative('f:/Recruiter-Appplication-V2/frontend/src', p))
  return n
}

function extractOne(cfg) {
  const srcText = fs.readFileSync(cfg.src, 'utf8')
  const srcLines = srcText.split(/\n/)
  fs.mkdirSync(cfg.destDir, { recursive: true })

  const fnLine = cfg.fnLine - 1
  const preambleRaw = srcLines.slice(0, fnLine).join('\n')
  const preamble = deepenImports(exportize(preambleRaw))

  const preChunks = []
  {
    const ls = preamble.split(/\n/)
    let cur = []
    for (const line of ls) {
      if (cur.length >= 175 && (line.startsWith('export ') || line.trim() === '')) {
        preChunks.push(cur.join('\n'))
        cur = []
      }
      cur.push(line)
    }
    if (cur.length) preChunks.push(cur.join('\n'))
  }
  const preFiles = preChunks.map((chunk, i) => {
    const fname = (i === 0 ? 'preamble' : 'preamble' + (i + 1)) + (chunk.includes('className=') ? '.tsx' : '.ts')
    write(path.join(cfg.destDir, fname), chunk + '\n')
    return fname
  })

  const fnSrc = srcLines.slice(fnLine).join('\n')
  const sigMatch = fnSrc.match(/^export function (\w+)\(([\s\S]*?)\) \{/)
  if (!sigMatch) throw new Error('sig ' + cfg.fnName)
  const propsInner = sigMatch[2].trim()
  const sigLineCount = sigMatch[0].split(/\n/).length
  const logicBody = srcLines.slice(fnLine + sigLineCount, cfg.logicEnd).join('\n')

  const propNames = collectPropNames(propsInner)
  const lucide = lucideFrom(srcText)

  const stateBody = srcLines.slice(fnLine + sigLineCount, cfg.handlerStart - 1).join('\n')
  const handlerBody = srcLines.slice(cfg.handlerStart - 1, cfg.logicEnd).join('\n')

  const stateBindings = collectBindings(stateBody)
  const handlerBindings = collectBindings(handlerBody)
  const allReturn = [...new Set([...propNames, ...stateBindings, ...handlerBindings])]

  const propsType = cfg.propsType
  const preImport = `import type { ${propsType} } from './${preFiles[0].replace(/\.tsx?$/, '')}'\n`

  // Other preamble files may export consts needed by hook - import * as needed via cfg.hookExtraImports
  const extraHookImp = (cfg.stateImports || cfg.hookExtraImports || []).join('\n') + ((cfg.stateImports || cfg.hookExtraImports) ? '\n' : '')
  const extraHandlerImp = (cfg.handlerImports || []).join('\n') + (cfg.handlerImports ? '\n' : '')

  const stateFile = `${preImport}${extraHookImp}import { useState, useMemo, useEffect, useRef } from 'react'\nimport React from 'react'\n\nexport function ${cfg.hookName}State(${propsInner}) {\n${stateBody}\n  return {\n    ${[...new Set([...propNames, ...stateBindings])].join(',\n    ')},\n  }\n}\nexport type ${cfg.vmType}State = ReturnType<typeof ${cfg.hookName}State>\n`
  write(path.join(cfg.destDir, cfg.hookName + 'State.ts'), stateFile)

  const hBind = [...new Set([...propNames, ...stateBindings])]
  const handlerChunks = []
  if (handlerBody.trim()) {
    const ls = handlerBody.split(/\n/)
    // keep as one if small
    if (ls.length + hBind.length + 20 <= 198) {
      handlerChunks.push(handlerBody)
    } else {
      let cur = []
      let parts = []
      for (const line of ls) {
        cur.push(line)
        if (cur.length >= 140 && (line.trim() === '}' || line.trim() === '')) {
          parts.push(cur.join('\n'))
          cur = []
        }
      }
      if (cur.length) parts.push(cur.join('\n'))
      handlerChunks.push(...parts)
    }
  }

  const handlerFiles = handlerChunks.map((chunk, i) => {
    const usedBind = usedNames(chunk, hBind)
    const names = collectTopFns(chunk)
    const fname = handlerChunks.length === 1 ? cfg.hookName + 'Handlers.ts' : cfg.hookName + 'Handlers' + (i + 1) + '.ts'
    const content = `import React from 'react'\n${extraHandlerImp}import type { ${cfg.vmType}State } from './${cfg.hookName}State'\n\nexport function ${cfg.hookName}Handlers${handlerChunks.length === 1 ? '' : String(i + 1)}(s: ${cfg.vmType}State) {\n  const {\n${formatList(usedBind)}\n  } = s\n${chunk}\n  return {\n${formatList(names)}\n  }\n}\n`
    write(path.join(cfg.destDir, fname), content)
    return { fname, exportName: `${cfg.hookName}Handlers${handlerChunks.length === 1 ? '' : String(i + 1)}`, names }
  })

  const hookMerge = `import type { ${propsType} } from './${preFiles[0].replace(/\.tsx?$/, '')}'\nimport { ${cfg.hookName}State } from './${cfg.hookName}State'\n${handlerFiles.map(h => `import { ${h.exportName} } from './${h.fname.replace(/\.ts$/, '')}'`).join('\n')}\n\nexport function ${cfg.hookName}(props: ${propsType}) {\n  const s = ${cfg.hookName}State(props)\n${handlerFiles.map((h, i) => `  const h${i + 1} = ${h.exportName}(s)`).join('\n')}\n  return { ...s, ${handlerFiles.map((_, i) => `...h${i + 1}`).join(', ')} }\n}\n\nexport type ${cfg.vmType} = ReturnType<typeof ${cfg.hookName}>\n`
  // State hook uses destructured params not props object!
  // Fix: State hook should accept props: Props and destructure inside.
  write(path.join(cfg.destDir, cfg.hookName + '.ts'), hookMerge)

  // Fix state to accept props object
  const stateFile2 = `${preImport}${extraHookImp}import { useState, useMemo, useEffect, useRef } from 'react'\nimport React from 'react'\n\nexport function ${cfg.hookName}State(props: ${propsType}) {\n  const ${propsInner.startsWith('{') ? propsInner : `{ ${propsInner} }`} = props as ${propsType} & Record<string, never>\n${stateBody}\n  return {\n    ${[...new Set([...propNames, ...stateBindings])].join(',\n    ')},\n  }\n}\nexport type ${cfg.vmType}State = ReturnType<typeof ${cfg.hookName}State>\n`
  write(path.join(cfg.destDir, cfg.hookName + 'State.ts'), stateFile2)

  const extraViewImp = (cfg.viewImports || []).join('\n')

  cfg.views.forEach(v => {
    const jsx = srcLines.slice(v.from - 1, v.to).join('\n')
    const used = usedNames(jsx, allReturn)
    const usedLucide = lucide.filter(x => usedNames(jsx, [x.alias]).length)
    const lucideImp = usedLucide.length
      ? `import { ${usedLucide.map(x => (x.orig === x.alias ? x.orig : `${x.orig} as ${x.alias}`)).join(', ')} } from 'lucide-react'\n`
      : ''
    const extraThis = (v.imports || []).concat(cfg.viewImports || []).join('\n')
    const desture = used.length ? `  const {\n    ${used.join(',\n    ')},\n  } = vm\n` : ''
    const body = v.mode === 'block'
      ? `  return (\n    <>\n${jsx}\n    </>\n  )\n`
      : `  return (\n${jsx}\n  )\n`
    const content = `import React from 'react'\n${lucideImp}${extraThis ? extraThis + '\n' : ''}import { ${cfg.vmType} } from './${cfg.hookName}'\n\nexport function ${v.name}({ vm }: { vm: ${cfg.vmType} }) {\n${desture}${body}}\n`
    write(path.join(cfg.destDir, v.name + '.tsx'), content)
  })

  const viewImps = cfg.views.map(v => `import { ${v.name} } from './${v.name}'`).join('\n')
  const composer = `import React from 'react'\nimport { ${propsType} } from './${preFiles[0].replace(/\.tsx?$/, '')}'\nimport { ${cfg.hookName} } from './${cfg.hookName}'\n${viewImps}\n\nexport function ${cfg.fnName}(props: ${propsType}) {\n  const vm = ${cfg.hookName}(props)\n${cfg.composer}\n}\n`
  write(path.join(cfg.destDir, cfg.fnName + 'View.tsx'), composer)

  const pub = []
  if (cfg.reexportTypes && cfg.reexportTypes.length) {
    pub.push(`export type { ${cfg.reexportTypes.join(', ')} } from './${path.basename(cfg.destDir)}/${preFiles[0].replace(/\.tsx?$/, '')}'`)
  }
  if (cfg.reexportValues && cfg.reexportValues.length) {
    pub.push(`export { ${cfg.reexportValues.join(', ')} } from './${path.basename(cfg.destDir)}/${preFiles[0].replace(/\.tsx?$/, '')}'`)
  }
  pub.push(`export { ${cfg.fnName} } from './${path.basename(cfg.destDir)}/${cfg.fnName}View'`)
  write(cfg.src, pub.join('\n') + '\n')
}

module.exports = { extractOne, deepenImports }
