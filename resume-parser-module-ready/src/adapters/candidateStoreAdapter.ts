import { ParsedCandidateResume } from '../types';

/**
 * Interface defining optional candidate persistence storage.
 * Applications integrating this parser can implement this interface to connect
 * PostgreSQL, Prisma, MongoDB, SQLite, or Redis.
 */
export interface CandidateStoreAdapter {
  saveCandidate(candidate: ParsedCandidateResume & { userId?: string }): Promise<{ id: string }>;
  getCandidateById(id: string): Promise<ParsedCandidateResume | null>;
  listCandidates(options?: { limit?: number; offset?: number }): Promise<ParsedCandidateResume[]>;
  deleteCandidate(id: string): Promise<boolean>;
}

/**
 * Default in-memory candidate store adapter.
 * Useful for development, testing, and serverless environments.
 */
export class InMemoryCandidateStore implements CandidateStoreAdapter {
  private records = new Map<string, ParsedCandidateResume>();
  private counter = 1;

  async saveCandidate(candidate: ParsedCandidateResume & { userId?: string }): Promise<{ id: string }> {
    const id = `cand_${this.counter++}_${Date.now()}`;
    this.records.set(id, { ...candidate });
    return { id };
  }

  async getCandidateById(id: string): Promise<ParsedCandidateResume | null> {
    return this.records.get(id) || null;
  }

  async listCandidates(options: { limit?: number; offset?: number } = {}): Promise<ParsedCandidateResume[]> {
    const all = Array.from(this.records.values());
    const offset = options.offset || 0;
    const limit = options.limit || all.length;
    return all.slice(offset, offset + limit);
  }

  async deleteCandidate(id: string): Promise<boolean> {
    return this.records.delete(id);
  }
}
