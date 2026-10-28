const http = require('http')

const PORT = Number(process.env.PORT || 3002)
const TOKEN = process.env.AI_GATEWAY_TOKEN || 'metaforge-ai-internal-service-token-2026'

function send(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) })
  res.end(payload)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      if (!chunks.length) return resolve({})
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function extract(text, pattern) {
  const match = String(text || '').match(pattern)
  return match ? (match[1] || match[0]).trim() : ''
}

const server = http.createServer(async (req, res) => {
  const url = req.url || '/'
  // Service-token verification on all endpoints except health
  if (url !== '/health') {
    const auth = req.headers.authorization || ''
    if (auth !== `Bearer ${TOKEN}`) {
      return send(res, 401, { error: 'unauthorized', message: 'Valid AI Gateway service token required' })
    }
  }

  if (req.method === 'GET' && url === '/health') {
    const configured = Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY)
    return send(res, 200, { status: 'ok', service: 'metaforge-ai-v2', mode: configured ? 'provider' : 'heuristic' })
  }

  if (req.method === 'POST' && url === '/parse-resume') {
    const body = await readBody(req).catch(() => ({}))
    const text = body.resumeText || ''
    const expNum = Number(extract(text, /(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i) || 0)
    return send(res, 200, {
      extractedData: {
        candidateName: extract(text, /(?:name|candidate name|full name)[:\s]+([A-Za-z .'-]+)/i) || extract(text, /^([A-Z][a-z]+\s+[A-Z][a-z]+)/m) || 'Unknown Candidate',
        email: extract(text, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/i),
        contactNumber: extract(text, /(?:phone|contact|mobile|tel)?[:\s]*(\+?\d[\d\s-]{8,}\d)/i) || extract(text, /(\+?\d[\d\s-]{8,}\d)/),
        primarySkill: extract(text, /(?:primary skill|technologies|tech stack|skills)[:\s]+([A-Za-z0-9, /+#.-]+)/i) || 'General',
        skills: extract(text, /(?:skills|key skills|core competencies)[:\s]+([A-Za-z0-9, /+#.-]+)/i) || extract(text, /(?:primary skill|technologies)[:\s]+([A-Za-z0-9, /+#.-]+)/i),
        technologies: extract(text, /(?:technologies|tech stack|tools)[:\s]+([A-Za-z0-9, /+#.-]+)/i) || extract(text, /(?:skills)[:\s]+([A-Za-z0-9, /+#.-]+)/i),
        totalExperienceYears: expNum,
        totalExperience: extract(text, /(?:total experience|experience|exp)[:\s]+([\d.]+\s*(?:years?|yrs?|months?)?)/i) || (expNum ? `${expNum} Years` : ''),
        relevantExperience: extract(text, /(?:relevant experience|rel exp)[:\s]+([\d.]+\s*(?:years?|yrs?|months?)?)/i),
        currentCompany: extract(text, /(?:current company|company|organization|employer|present company)[:\s]+([A-Za-z0-9 .&,-]+)/i),
        qualification: extract(text, /(?:qualification|education|degree)[:\s]+([A-Za-z0-9 .&,-]+)/i) || extract(text, /(B\.?Tech|M\.?Tech|B\.?E\.?|M\.?C\.?A\.?|B\.?S\.?c|M\.?S\.?c|MBA|Bachelor|Master)/i),
        currentCtc: extract(text, /(?:current ctc|cctc|present ctc)[:\s]+([A-Za-z0-9 .$/-]+)/i),
        expectedCtc: extract(text, /(?:expected ctc|ectc)[:\s]+([A-Za-z0-9 .$/-]+)/i),
        currentLocation: extract(text, /(?:location|current location|city)[:\s]+([A-Za-z .-]+)/i),
        noticePeriod: extract(text, /(?:notice period|notice)[:\s]+([A-Za-z0-9 .-]+)/i),
        summary: String(text).slice(0, 280),
      },
      confidenceScore: text ? 0.85 : 0.4,
    })
  }

  if (req.method === 'POST' && (url === '/match' || url === '/enrich')) {
    const body = await readBody(req).catch(() => ({}))
    return send(res, 200, { ok: true, echo: body, provider: 'metaforge-ai-v2' })
  }

  send(res, 404, { error: 'not_found' })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`V2 AI gateway listening on http://127.0.0.1:${PORT} (internal only)`)
})
