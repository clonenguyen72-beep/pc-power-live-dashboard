import { Redis as UpstashRedis } from "@upstash/redis";
import IORedis from "ioredis";

export interface RedisLike {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<unknown>;
  lpush(key: string, value: string): Promise<unknown>;
  ltrim(key: string, start: number, stop: number): Promise<unknown>;
  lrange(key: string, start: number, stop: number): Promise<unknown>;
}

class UpstashAdapter implements RedisLike {
  constructor(private client: UpstashRedis) {}
  get(key: string) {
    return this.client.get(key);
  }
  set(key: string, value: unknown) {
    return this.client.set(key, value);
  }
  lpush(key: string, value: string) {
    return this.client.lpush(key, value);
  }
  ltrim(key: string, start: number, stop: number) {
    return this.client.ltrim(key, start, stop);
  }
  lrange(key: string, start: number, stop: number) {
    return this.client.lrange(key, start, stop);
  }
}

class IORedisAdapter implements RedisLike {
  constructor(private client: IORedis) {}
  async get(key: string) {
    const raw = await this.client.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  async set(key: string, value: unknown) {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    return this.client.set(key, serialized);
  }
  lpush(key: string, value: string) {
    return this.client.lpush(key, value);
  }
  ltrim(key: string, start: number, stop: number) {
    return this.client.ltrim(key, start, stop);
  }
  lrange(key: string, start: number, stop: number) {
    return this.client.lrange(key, start, stop);
  }
}

let redis: RedisLike | null = null;

export function getRedis(): RedisLike {
  if (redis) return redis;

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (upstashUrl && upstashToken) {
    redis = new UpstashAdapter(new UpstashRedis({ url: upstashUrl, token: upstashToken }));
    return redis;
  }

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    redis = new IORedisAdapter(new IORedis(redisUrl));
    return redis;
  }

  throw new Error(
    "Missing Redis credentials. Set UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_URL/TOKEN), or REDIS_URL."
  );
}
