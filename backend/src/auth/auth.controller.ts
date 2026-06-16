import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Patch,
  Post,
  Req,
} from "@nestjs/common";

import { Public } from "../common/public.decorator.js";
import { RateLimit } from "../common/rateLimit.decorator.js";
import { AuthService } from "./auth.service.js";
import { extractBearerToken } from "./authToken.js";
import type { AuthenticatedRequest } from "./authTypes.js";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Public()
  @RateLimit({
    keyPrefix: "auth:register",
    windowMs: 5 * 60 * 1000,
    max: 5,
    bodyField: "email",
  })
  @Post("register")
  register(@Body() body: unknown) {
    return this.authService.register(body);
  }

  @Public()
  @RateLimit({
    keyPrefix: "auth:login",
    windowMs: 60 * 1000,
    max: 10,
    bodyField: "email",
  })
  @Post("login")
  login(@Body() body: unknown) {
    return this.authService.login(body);
  }

  @Get("me")
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.me(request.authUser!);
  }

  @Patch("me")
  updateMe(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    return this.authService.updateMe(request.authUser!, body);
  }

  @Post("logout")
  logout(@Headers("authorization") authorization: string | undefined) {
    return this.authService.logout(extractBearerToken(authorization));
  }
}
