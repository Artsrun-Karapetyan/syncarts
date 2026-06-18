import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { z } from "zod";

import { PrismaService } from "../prisma/prisma.service.js";

const registerSchema = z.object({
  email: z
    .string()
    .email("Enter a valid email address.")
    .transform((value) => value.trim().toLowerCase()),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(120, "Name must be 120 characters or fewer.")
    .transform((value) => value.trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be 128 characters or fewer."),
});

const loginSchema = z.object({
  email: z
    .string()
    .email("Enter a valid email address.")
    .transform((value) => value.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be 128 characters or fewer."),
});

const updateMeSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(120, "Name must be 120 characters or fewer.")
    .optional(),
});

type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
};

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async register(body: unknown) {
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) {
      throw new ConflictException("Email is already registered");
    }

    const password = hashPassword(parsed.data.password);

    const result = await this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          email: parsed.data.email,
          name: parsed.data.name,
          passwordHash: password.hash,
          passwordSalt: password.salt,
        },
      });

      const session = await createSession(transaction, user.id);
      return { user, session };
    });

    return {
      user: toUser(result.user),
      token: result.session.token,
    };
  }

  async login(body: unknown) {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const user = await this.prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const verified = verifyPassword(
      parsed.data.password,
      user.passwordHash,
      user.passwordSalt,
    );
    if (!verified) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const session = await createSession(this.prisma, user.id);
    return {
      user: toUser(user),
      token: session.token,
    };
  }

  async logout(token: string) {
    if (!token) {
      throw new BadRequestException("Missing auth token");
    }

    const tokenHash = hashToken(token);
    await this.prisma.session.deleteMany({ where: { tokenHash } });
    return { success: true };
  }

  async me(user: AuthUser) {
    return user;
  }

  async updateMe(user: AuthUser, body: unknown) {
    const parsed = updateMeSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name:
          parsed.data.name === undefined ? undefined : parsed.data.name.trim(),
      },
    });

    return toUser(updated);
  }
}

function toUser(user: {
  id: string;
  email: string;
  name?: string | null;
  createdAt: Date;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    createdAt: user.createdAt,
  };
}

function createSession(
  database: Pick<PrismaService, "session">,
  userId: string,
): Promise<{ token: string }> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  return database.session
    .create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    })
    .then(() => ({ token }));
}

function hashPassword(password: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(
  password: string,
  passwordHash: string,
  passwordSalt: string,
): boolean {
  const hash = scryptSync(password, passwordSalt, 64);
  const expected = Buffer.from(passwordHash, "hex");
  return expected.length === hash.length && timingSafeEqual(expected, hash);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
