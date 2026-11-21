import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export interface AuthenticatedBankingUser {
  id: string;
  email: string;
  role: UserRole;
  customerProfileId?: string;
  employeeCode?: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedBankingUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
