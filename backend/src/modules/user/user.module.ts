import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserController } from "./application/user.controller";
import { TokenService } from "./application/token.service";
import { UserOrmEntity } from "./infrastructure/entities/user";
import { UserGateway } from "./presentation/user.gateway";
import { CloudinaryService } from "@common/infrastructure/cloudinary/cloudinary.service";
import { CloudinaryProvider } from "@common/infrastructure/cloudinary/cloudinary.provider";
import { UserFacade } from "./application/facades/user.facade";
import { GetMeUseCase } from "./application/use-case/get-me.use-case";
import { GetUserByIdUseCase } from "./application/use-case/get-user-by-id.use-case";
import { LoginAnonymousUseCase } from "./application/use-case/login-anonymous.use-case";
import { LoginRegisteredUseCase } from "./application/use-case/login-registered.use-case";
import { RegisterUseCase } from "./application/use-case/register.use-case";
import { RefreshTokenUseCase } from "./application/use-case/refresh-token.use-case";
import { LogoutUseCase } from "./application/use-case/logout.use-case";
import { UpdateAvatarUseCase } from "./application/use-case/update-avatar.use-case";
import { GetUsersShortInfoUseCase } from "./application/use-case/get-users-short-info.use-case";
import { GetUserProfileUseCase } from "./application/use-case/get-user-profile.use-case";
import { USER_REPOSITORY } from "./application/user.repository.interface";
import { UserRepository } from "./infrastructure/user.repository";
import { ImageService } from "./application/image.service";
import { UpdateUserStatOnGameFinishedHandler } from "./application/handlers/update-user-stat-on-game-finished";

@Module({
	imports: [TypeOrmModule.forFeature([UserOrmEntity])],
	controllers: [UserController],
	providers: [
		{
			provide: USER_REPOSITORY,
			useClass: UserRepository,
		},
		TokenService,
		UserGateway,
		CloudinaryProvider,
		CloudinaryService,
		UserFacade,
		ImageService,
		UpdateUserStatOnGameFinishedHandler,
		GetMeUseCase,
		GetUserByIdUseCase,
		LoginAnonymousUseCase,
		LoginRegisteredUseCase,
		RegisterUseCase,
		RefreshTokenUseCase,
		LogoutUseCase,
		UpdateAvatarUseCase,
		GetUsersShortInfoUseCase,
		GetUserProfileUseCase,
	],
	exports: [UserFacade],
})
export class UserModule {}
