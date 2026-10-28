/**
 * Background worker process for MetaForge Recruiter V2.
 * Consumes Redis lists when REDIS_URL is set; otherwise idles as a health process.
 */
const Redis = require('ioredis')

const REDIS_URL = process.env.REDIS_URL || ''
const QUEUE = process.env.WORKER_QUEUE || 'mrap:jobs'

async function handleJob(raw) {
  let job
  try {
    job = JSON.parse(raw)
  } catch {
    console.warn('Skipping malformed job payload')
    return
  }
  console.log(`Processed job ${job.type || 'unknown'}`, job.id || '')
}

async function main() {
  if (!REDIS_URL) {
    console.log('REDIS_URL not set — worker idle (in-process fallback is used by the API)')
    setInterval(() => {}, 60_000)
    return
  }

  const redis = new Redis(REDIS_URL)
  console.log(`V2 worker listening on ${QUEUE}`)
  while (true) {
    try {
      const result = await redis.brpop(QUEUE, 15)
      if (result && result[1]) await handleJob(result[1])
    } catch (err) {
      console.error('Worker loop error', err.message)
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
}

main()
