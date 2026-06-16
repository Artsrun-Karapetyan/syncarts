import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { RATE_LIMIT_KEY, type RateLimitOptions } from "./rateLimit.decorator.js";

type RateLimitRequest = {
  body?: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RateLimitRequest>();
    const now = Date.now();
    const key = getBucketKey(request, options);
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      cleanupExpiredBuckets(now);
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return true;
    }

    if (bucket.count >= options.max) {
      throw new HttpException("Too many requests", HttpStatus.TOO_MANY_REQUESTS);
    }

    bucket.count += 1;
    return true;
  }
}

function getBucketKey(
  request: RateLimitRequest,
  options: RateLimitOptions,
): string {
  const fieldValue = options.bodyField
    ? request.body?.[options.bodyField]
    : undefined;
  const bodyValue =
    typeof fieldValue === "string" ? fieldValue.toLowerCase() : "";

  return [options.keyPrefix, getClientIp(request), bodyValue].join(":");
}

function getClientIp(request: RateLimitRequest): string {
  const forwardedFor = request.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }

  return request.ip ?? request.socket?.remoteAddress ?? "unknown";
}

function cleanupExpiredBuckets(now: number) {
  if (buckets.size < 10000) {
    return;
  }

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}
