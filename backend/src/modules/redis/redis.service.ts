import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  status: 'disabled' | 'connected' | 'error' = 'disabled';

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.log('REDIS_URL not set — cache and queues run in-process');
      return;
    }

    try {
      this.client = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true });
      await this.client.connect();
      this.status = 'connected';
      this.logger.log('Redis connected');
    } catch (err) {
      this.status = 'error';
      this.client = null;
      this.logger.warn(`Redis unavailable (${(err as Error).message}) — using in-memory fallback`);
    }
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit().catch(() => undefined);
  }

  getClient(): Redis | null {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      if (ttlSeconds) await this.client.set(key, value, 'EX', ttlSeconds);
      else await this.client.set(key, value);
    } catch {
      // ignore cache write failures
    }
  }
}
