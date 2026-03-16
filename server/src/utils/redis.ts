import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: "EX", durationSeconds?: number): Promise<"OK" | null>;
  del(key: string): Promise<number>;
}

const hasRedisConfig =
  Boolean(process.env.REDIS_URL) ||
  Boolean(process.env.REDIS_HOST);

let redis: RedisLike;

if (!hasRedisConfig) {
  // Redis disabled: provide a no-op fallback to avoid crashing in production.
  redis = {
    get: async () => null,
    set: async () => null,
    del: async () => 0,
  };
} else {
  const client = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL)
    : new Redis({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      });

  client.on("error", (err) => {
    console.error("[redis] connection error:", err);
  });

  redis = {
    get: (key) => client.get(key),
    set: (key, value, mode, durationSeconds) => {
      if (mode && typeof durationSeconds === "number") {
        return client.set(key, value, mode, durationSeconds);
      }
      return client.set(key, value);
    },
    del: (key) => client.del(key),
  };
}

export { redis };
