const fs = require('fs')
const p = 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/submissions/preamble.ts'
const t = fs.readFileSync(p, 'utf8')
const i = t.indexOf('export const DEFAULT_SCREENSHOT_SUBMISSIONS')
fs.writeFileSync(
  'f:/Recruiter-Appplication-V2/frontend/src/components/pages/submissions/submissions.data.ts',
  "import { ScreenshotSubmission } from './preamble'\n\n" + t.slice(i),
)
const typesOnly = t.slice(0, i).replace(
  /import React[\s\S]*from '\.\.\/modals\/ScheduleInterviewModal'\n\n/,
  "import { Submission, Requirement, Role } from '../../../types'\n\n",
)
fs.writeFileSync(p, typesOnly)
console.log('preamble', typesOnly.split(/\n/).length)
console.log('data', t.slice(i).split(/\n/).length)
