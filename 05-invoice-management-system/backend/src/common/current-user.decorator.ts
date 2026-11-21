import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedInvoiceUser {
  id: string;
  email: string;
  fullName: string;
  organizationId: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedInvoiceUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
