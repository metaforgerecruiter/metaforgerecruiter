const fs = require('fs')
const path = require('path')

function nestChild(parentFile, childName, from, to) {
  const lines = fs.readFileSync(parentFile, 'utf8').split(/\n/)
  const slice = lines.slice(from - 1, to)
  const dir = path.dirname(parentFile)
  const vmMatch = fs.readFileSync(parentFile, 'utf8').match(/import \{ (\w+) \} from '\.\/use/)
  const vmType = vmMatch ? vmMatch[1] : 'any'
  const hook = vmMatch ? vmMatch[0].replace('import { ' + vmType, "import { " + vmType) : ''
  const hookImport = (fs.readFileSync(parentFile, 'utf8').match(/import \{ \w+ \} from '\.\/use[^']+'/) || [''])[0]
  const destructure = (fs.readFileSync(parentFile, 'utf8').match(/  const \{[\s\S]*?\} = vm/) || ['  const vm = vm'])[0]
  const lucide = (fs.readFileSync(parentFile, 'utf8').match(/import \{[^}]+\} from 'lucide-react'\n/) || [''])[0]
  const extra = (fs.readFileSync(parentFile, 'utf8').match(/import \{[^}]+\} from '\.\.\/[^']+'\n/g) || []).join('')
  const child = `import React from 'react'\n${lucide}${hookImport}\n\nexport function ${childName}({ vm }: { vm: ${vmType} }) {\n${destructure}\n  return (\n    <>\n${slice.join('\n')}\n    </>\n  )\n}\n`
  const childPath = path.join(dir, childName + '.tsx')
  fs.writeFileSync(childPath, child)
  const parentImp = `import { ${childName} } from './${childName}'\n`
  let parent = fs.readFileSync(parentFile, 'utf8')
  if (!parent.includes(`import { ${childName} }`)) {
    parent = parent.replace(/^import React from 'react'\n/, `import React from 'react'\n${parentImp}`)
  }
  const before = lines.slice(0, from - 1)
  const after = lines.slice(to)
  const newBody = [...before, `          <${childName} vm={vm} />`, ...after]
  // rebuild from newBody but we already mutated import via parent string...
  const withoutSlice = lines.slice(0, from - 1).concat([`          <${childName} vm={vm} />`]).concat(lines.slice(to))
  let text = withoutSlice.join('\n')
  if (!text.includes(`import { ${childName} }`)) {
    text = text.replace(/^import React from 'react'\n/, `import React from 'react'\nimport { ${childName} } from './${childName}'\n`)
  }
  fs.writeFileSync(parentFile, text)
  console.log('child', child.split(/\n/).length, childName)
  console.log('parent', text.split(/\n/).length, path.basename(parentFile))
}

module.exports = { nestChild }
