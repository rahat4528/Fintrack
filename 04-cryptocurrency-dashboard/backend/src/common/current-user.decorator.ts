import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedCryptoUser {
  id: string;
  email: string;
  fullName: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedCryptoUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
