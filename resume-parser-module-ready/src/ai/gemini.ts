import { config } from './config';
import { EXTRACTION_PROMPT, buildTextPrompt } from './prompt';
import { extractJsonFromText, validateParsedResult } from './schema';
import { normalizeParsedResult } from './normalize';
import { extractPdfText } from './pdfText';
import { MetaforgeParsed } from '../types';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const modelCooldowns = new Map<string, number>();
let preferredWorkingModel: string | null = null;

export function markModelSuccess(model: string) {
  preferredWorkingModel = model;
  modelCooldowns.delete(model);
}

export function markModelFailure(model: string, cooldownMs = 60_000) {
  modelCooldowns.set(model, Date.now() + cooldownMs);
}

function getModelsToTry(): string[] {
  const now = Date.now();
  const allModels = [config.geminiModel, ...config.geminiFallbackModels.filter((m) => m !== config.geminiModel)];

  for (const [m, expireAt] of modelCooldowns.entries()) {
    if (now >= expireAt) {
      modelCooldowns.delete(m);
    }
  }

  const available = allModels.filter((m) => !modelCooldowns.has(m));
  const candidatePool = available.length > 0 ? available : allModels;

  if (preferredWorkingModel && candidatePool.includes(preferredWorkingModel)) {
    return [preferredWorkingModel, ...candidatePool.filter((m) => m !== preferredWorkingModel)];
  }

  return candidatePool;
}

function isRetryableModelError(status: number, msg: string): boolean {
  return (
    status === 429 ||
    status === 503 ||
    status === 404 ||
    /quota|rate.?limit|high demand|overloaded|unavailable|try again/i.test(msg) ||
    /not found|not supported/i.test(msg)
  );
}

function extractGeminiText(data: any): string {
  const candidate = data?.candidates?.[0];

  if (!candidate) {
    const block = data?.promptFeedback?.blockReason;
    if (block) throw new Error(`Request blocked: ${block}`);
    throw new Error('Empty response from Gemini');
  }

  if (candidate.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason)) {
    console.warn('Gemini finishReason:', candidate.finishReason);
    if (candidate.finishReason === 'SAFETY') {
      throw new Error('Content blocked by safety filter. Try a different file format.');
    }
  }

  const text = candidate.content?.parts?.map((p: any) => p.text || '').join('').trim() || '';
  if (!text) {
    throw new Error('Empty response from Gemini');
  }
  return text;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function callGemini(
  parts: any[],
  {
    maxRetries = 2,
    maxOutputTokens = 1536,
    systemInstruction,
    useJsonMode = true,
  }: {
    maxRetries?: number;
    maxOutputTokens?: number;
    systemInstruction?: string;
    useJsonMode?: boolean;
  } = {},
): Promise<string> {
  const models = getModelsToTry();
  let lastError: Error | null = null;

  for (const model of models) {
    const url = `${GEMINI_BASE}/models/${model}:generateContent`;

    const generationConfig: Record<string, any> = {
      temperature: 0.1,
      maxOutputTokens,
      // Gemini 2.5+ uses thinking tokens against maxOutputTokens by default.
      // That often yields empty/truncated JSON with modest budgets (ERR: No JSON).
      thinkingConfig: { thinkingBudget: 0 },
    };
    if (useJsonMode) {
      generationConfig.responseMimeType = 'application/json';
    }

    const body: Record<string, any> = {
      contents: [{ role: 'user', parts }],
      generationConfig,
    };

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': config.geminiApiKey,
          },
          body: JSON.stringify(body),
        });

        const data = (await resp.json()) as any;

        if (!resp.ok) {
          const msg = data?.error?.message || `Gemini API error (${resp.status})`;
          if (
            resp.status === 400 ||
            resp.status === 401 ||
            resp.status === 403 ||
            /API key not valid|invalid.*api.*key/i.test(msg)
          ) {
            throw new Error(`Invalid Gemini API key: ${msg}`);
          }
          if (resp.status === 429 || /quota|resource.?exhausted/i.test(msg)) {
            markModelFailure(model, 180_000); // 3 min cooldown
            throw new Error(`Gemini API quota exceeded: ${msg}`);
          }
          if (resp.status === 404 || /not found|not supported|no longer available/i.test(msg)) {
            markModelFailure(model, 3600_000); // 1 hour cooldown for dead models
            lastError = new Error(msg);
            break;
          }
          if (isRetryableModelError(resp.status, msg) && attempt < maxRetries - 1) {
            await sleep(/high demand|overloaded/i.test(msg) ? 1000 : 500);
            continue;
          }
          if (/high demand|overloaded/i.test(msg)) {
            markModelFailure(model, 30_000);
            throw new Error('AI models are busy right now. Please wait a moment and try again.');
          }
          throw new Error(msg);
        }

        markModelSuccess(model);
        return extractGeminiText(data);
      } catch (err: any) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (
          attempt < maxRetries - 1 &&
          !/invalid.*gemini|invalid.*key|quota|not found|not supported/i.test(lastError.message)
        ) {
          await sleep(1500 * (attempt + 1));
          continue;
        }
        if (!isRetryableModelError(0, lastError.message) || model === models[models.length - 1]) {
          throw lastError;
        }
        break;
      }
    }
  }

  throw lastError || new Error('Gemini API request failed');
}

function finalizeParse(raw: string): MetaforgeParsed {
  const parsed = extractJsonFromText(raw);
  const validation = validateParsedResult(parsed);
  if (!validation.valid) {
    throw new Error(`Invalid parse result: ${validation.errors.join(', ')}`);
  }
  return normalizeParsedResult(parsed);
}

async function tryParse(parts: any[], label: string): Promise<MetaforgeParsed> {
  const errors: string[] = [];

  for (const useJsonMode of [true, false]) {
    try {
      const raw = await callGemini(parts, { maxOutputTokens: 4096, useJsonMode });
      return finalizeParse(raw);
    } catch (err: any) {
      errors.push(`${label}${useJsonMode ? '' : ' (plain)'}: ${err?.message || err}`);
      if (!/No JSON|Empty response|Invalid parse/i.test(err?.message || '')) {
        throw err;
      }
    }
  }

  throw new Error(errors[errors.length - 1] || 'Failed to parse resume');
}

export async function parseResumeFromPdf(
  base64Data: string,
  pdfBuffer?: Buffer,
): Promise<MetaforgeParsed> {
  const pdfParts = [
    { inlineData: { mimeType: 'application/pdf', data: base64Data } },
    { text: EXTRACTION_PROMPT },
  ];

  try {
    return await tryParse(pdfParts, 'PDF');
  } catch (pdfErr: any) {
    if (/invalid.*key|quota|resource.?exhausted/i.test(pdfErr.message)) {
      throw pdfErr;
    }
    console.warn('PDF multimodal parse failed, trying text fallback:', pdfErr.message);

    if (pdfBuffer) {
      const text = await extractPdfText(pdfBuffer);
      if (text.length > 50) {
        try {
          return await tryParse([{ text: buildTextPrompt(text) }], 'PDF-text');
        } catch (textErr: any) {
          throw new Error(textErr.message || pdfErr.message);
        }
      }
    }

    throw new Error(pdfErr.message || 'Failed to parse PDF resume');
  }
}

export async function parseResumeFromText(resumeText: string): Promise<MetaforgeParsed> {
  return tryParse([{ text: buildTextPrompt(resumeText) }], 'text');
}

export async function extractSkillsWithGemini(skillsSectionText: string): Promise<string[]> {
  if (!skillsSectionText || !skillsSectionText.trim()) return [];

  const prompt = `You are a strict recruitment extraction specialist.
Extract ONLY the explicitly mentioned individual technical and professional skills from the provided text snippet.

RULES:
1. Extract ONLY individual skill names that literally appear or are clearly demonstrated in the text snippet.
2. PRIMARY: Extract from the dedicated Skills section if present.
3. FALLBACK: If no dedicated Skills section exists, extract explicitly evidenced skills from summary, technical projects, work experience, or education.
4. Separate multiple skills from compound lines or categories (e.g. "Languages: C++, Python" -> ["C++", "Python"]).
5. NEVER infer, guess, or invent skills not present in the text.
6. Do NOT extract whole sentences, job responsibilities, project descriptions, company names, or degree names.
7. Return at most 10 unique skills in order of appearance.
8. Return JSON format strictly:
{
  "skills": ["Skill 1", "Skill 2"]
}

SOURCE TEXT:
"""
${skillsSectionText.slice(0, 4000)}
"""`;

  try {
    const raw = await callGemini([{ text: prompt }], { maxOutputTokens: 1024, useJsonMode: true });
    const parsed = extractJsonFromText(raw);
    if (Array.isArray(parsed?.skills)) {
      return parsed.skills
        .map((s: any) => (typeof s === 'string' ? s.trim() : ''))
        .filter(Boolean)
        .slice(0, 10);
    }
  } catch (err: any) {
    console.warn('[skills-engine] AI fallback call failed:', err?.message || err);
  }
  return [];
}

export async function chatWithContext({
  messages,
  candidateProfile,
}: {
  messages: Array<{ role: string; content: string }>;
  candidateProfile?: any;
}): Promise<string> {
  const systemInstruction = `You are an expert technical recruiter and talent evaluation specialist.${
    candidateProfile
      ? `\nCandidate profile:\n${JSON.stringify(candidateProfile, null, 2)}`
      : ''
  }\nHelp assess candidates, evaluate skill alignment, compare with job descriptions, and highlight strengths or risks. Be concise, objective, and professional.`;

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
  }));

  const models = getModelsToTry();
  let lastError: Error | undefined;

  for (const model of models) {
    const url = `${GEMINI_BASE}/models/${model}:generateContent`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.geminiApiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
      }),
    });

    const data = (await resp.json()) as any;

    if (!resp.ok) {
      const msg = data?.error?.message || `Gemini API error (${resp.status})`;
      if (isRetryableModelError(resp.status, msg) && model !== models[models.length - 1]) {
        lastError = new Error(msg);
        continue;
      }
      if (/quota|rate.?limit/i.test(msg)) {
        throw new Error('Gemini API quota exceeded. Check billing or try again later.');
      }
      throw new Error(msg);
    }

    return extractGeminiText(data);
  }

  throw lastError || new Error('Chat request failed');
}

