import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { TokenService } from "./token.service";
import { AuthGateway } from "./auth.gateway";

@Module({
	controllers: [AuthController],
	providers: [AuthService, TokenService, AuthGateway],
})
export class AuthModule {}
