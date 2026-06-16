import { SetMetadata } from "@nestjs/common";

export const RATE_LIMIT_KEY = "syncarts:rate-limit";

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyPrefix: string;
  bodyField?: string;
};

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);
