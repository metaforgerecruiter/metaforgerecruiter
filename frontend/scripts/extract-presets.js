const fs = require('fs')
const orig = fs.readFileSync('f:/Recruiter-Appplication-V2/frontend/scripts/orig/SubmitToLeadPage.tsx', 'utf8').split(/\n/)
const presets = orig.slice(86, 233).join('\n').replace(/^  /gm, '')
fs.writeFileSync(
  'f:/Recruiter-Appplication-V2/frontend/src/components/pages/submit-to-lead/trackerPresets.data.ts',
  presets.replace('const CLIENT_TRACKER_PRESETS', 'export const CLIENT_TRACKER_PRESETS') + '\n',
)
const statePath = 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/submit-to-lead/useSubmitToLeadPageState.ts'
let state = fs.readFileSync(statePath, 'utf8')
const start = state.indexOf('  const CLIENT_TRACKER_PRESETS')
const end = state.indexOf('  const [clientName')
if (start < 0 || end < 0) {
  console.log('markers', start, end)
  process.exit(1)
}
state = "import { CLIENT_TRACKER_PRESETS } from './trackerPresets.data'\n" + state.slice(0, start) + state.slice(end)
fs.writeFileSync(statePath, state)
console.log('state lines', state.split(/\n/).length)
console.log('presets lines', presets.split(/\n/).length)
