import { createParamDecorator } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';

export type UserMetadata = {
  userId: string;
  phone: string;
};
export const GetUserMetadata = createParamDecorator(
  (data: unknown, ctx: ExecutionContextHost): UserMetadata | false => {
    const request: Request & { user: UserMetadata } = ctx
      .switchToHttp()
      .getRequest();
    return {
      userId: request.user.userId,
      phone: request.user.phone,
    };
  },
);
