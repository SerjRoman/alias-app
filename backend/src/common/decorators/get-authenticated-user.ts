/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

export const GetAuthenticatedUser = createParamDecorator(
	(data: unknown, ctx: ExecutionContext) => {
		if (ctx.getType() === "http") {
			const request = ctx.switchToHttp().getRequest();
			return request.user;
		}
		if (ctx.getType() === "ws") {
			const client = ctx.switchToWs().getClient();
			return client.data.user;
		}
	},
);
