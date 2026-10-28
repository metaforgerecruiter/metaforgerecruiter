import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: (process.env.GEMINI_API_KEY || '').trim(),
  geminiModel: (
    process.env.GEMINI_MODEL ||
    process.env.GEMINI_RESUME_MODEL ||
    'gemini-2.5-flash-lite'
  ).trim(),
  geminiFallbackModels: (
    process.env.GEMINI_FALLBACK_MODELS || 'gemini-2.5-flash,gemini-2.0-flash'
  )
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  maxFileSizeMb: 10,
  maxBulkFiles: 5,
};

export function getAiModelLabel(): string {
  const primary = config.geminiModel;
  const fallbacks = config.geminiFallbackModels.filter((m) => m !== primary);
  return fallbacks.length ? `${primary} (+ ${fallbacks.join(', ')})` : primary;
}
