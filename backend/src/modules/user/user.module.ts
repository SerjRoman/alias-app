import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserController } from "./application/user.controller";
import { TokenService } from "./application/token.service";
import { UserOrmEntity } from "./infrastructure/entities/user";
import { UserGateway } from "./application/user.gateway";
import { CloudinaryService } from "@common/infrastructure/cloudinary/cloudinary.service";
import { CloudinaryProvider } from "@common/infrastructure/cloudinary/cloudinary.provider";
import { UserFacade } from "./application/facades/user.facade";
import { GetMeUseCase } from "./application/use-case/get-me.use-case";
import { GetUserByIdUseCase } from "./application/use-case/get-user-by-id.use-case";
import { LoginAnonymousUseCase } from "./application/use-case/login-anonymous.use-case";
import { LoginRegisteredUseCase } from "./application/use-case/login-registered.use-case";
import { RegisterUseCase } from "./application/use-case/register.use-case";
import { UpdateAvatarUseCase } from "./application/use-case/update-avatar.use-case";
import {
	USER_REPOSITORY,
	type IUserRepository,
} from "./application/user.repository.interface";
import { UserRepository } from "./infrastructure/user.repository";
import { ImageService } from "./application/image.service";
import { GetUsersShortInfoUseCase } from "./application/use-case/get-users-short-info.use-case";
import { ConfigService } from "@nestjs/config";
import { GetUserProfileUseCase } from "./application/use-case/get-user-profile.use-case";
import { UpdateUserStatOnGameFinishedHandler } from "./application/handlers/update-user-stat-on-game-finished";

const useCaseProviders = [
	{
		provide: GetMeUseCase,
		useFactory: (repository: IUserRepository) =>
			new GetMeUseCase(repository),
		inject: [USER_REPOSITORY],
	},
	{
		provide: GetUserByIdUseCase,
		useFactory: (repository: IUserRepository) =>
			new GetUserByIdUseCase(repository),
		inject: [USER_REPOSITORY],
	},
	{
		provide: LoginAnonymousUseCase,
		useFactory: (tokenService: TokenService) =>
			new LoginAnonymousUseCase(tokenService),
		inject: [TokenService],
	},
	{
		provide: LoginRegisteredUseCase,
		useFactory: (repository: IUserRepository, tokenService: TokenService) =>
			new LoginRegisteredUseCase(repository, tokenService),
		inject: [USER_REPOSITORY, TokenService],
	},
	{
		provide: RegisterUseCase,
		useFactory: (
			repository: IUserRepository,
			tokenService: TokenService,
			configService: ConfigService,
		) => new RegisterUseCase(repository, tokenService, configService),
		inject: [USER_REPOSITORY, TokenService, ConfigService],
	},
	{
		provide: UpdateAvatarUseCase,
		useFactory: (repository: IUserRepository) =>
			new UpdateAvatarUseCase(repository),
		inject: [USER_REPOSITORY],
	},
	{
		provide: GetUsersShortInfoUseCase,
		useFactory: (repository: IUserRepository) =>
			new GetUsersShortInfoUseCase(repository),
		inject: [USER_REPOSITORY],
	},
	{
		provide: GetUserProfileUseCase,
		useFactory: (repository: IUserRepository) =>
			new GetUserProfileUseCase(repository),
		inject: [USER_REPOSITORY],
	},
];

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
		...useCaseProviders,
	],
	exports: [UserFacade],
})
export class UserModule {}
