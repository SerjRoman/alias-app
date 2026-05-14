import {
	Controller,
	Post,
	Body,
	HttpStatus,
	Get,
	UseGuards,
	Param,
	Put,
	UseInterceptors,
	UploadedFile,
	BadRequestException,
	ParseFilePipe,
	FileTypeValidator,
	MaxFileSizeValidator,
} from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AnonymousLoginDto } from "./dto/anonymous-login.dto";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiConsumes,
	ApiBody,
} from "@nestjs/swagger";
import { LoginResponseDto } from "./dto/login-response.dto";
import { plainToInstance } from "class-transformer";
import { MeDtoResponse } from "./dto/me.dto";
import { UserShortInfoResponseDto } from "./dto/user-short-info.dto";
import { GetAuthenticatedUser } from "@common/decorators/get-authenticated-user";
import { JwtAuthGuard } from "@common/guards/auth.guard";
import type { AuthenticatedUser } from "@common/types/authenticated-user";
import { UserFacade } from "./facades/user.facade";
import { FileInterceptor } from "@nestjs/platform-express";
import { CloudinaryService } from "@common/infrastructure/cloudinary/cloudinary.service";
import type { Express } from "express";
import { UploadApiResponse } from "cloudinary";
import { ImageService } from "./image.service";
import {
	UploadAvatarDto,
	UploadAvatarResponseDto,
} from "./dto/upload-avatar.dto";
@ApiTags("User")
@Controller("user")
export class UserController {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly cloudinaryService: CloudinaryService,
		private readonly imageService: ImageService,
	) {}

	@Post("login/anonymous")
	@ApiOperation({ summary: "Anonymous user login" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "The anonymous user has been successfully logged in.",
		type: LoginResponseDto,
	})
	async loginAnonymous(
		@Body() dto: AnonymousLoginDto,
	): Promise<LoginResponseDto> {
		return plainToInstance(
			LoginResponseDto,
			await this.userFacade.loginAnonymous(dto),
		);
	}

	@Post("login")
	@ApiOperation({ summary: "Registered user login" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "The user has been successfully logged in.",
		type: LoginResponseDto,
	})
	async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
		return plainToInstance(
			LoginResponseDto,
			await this.userFacade.loginRegistered(dto),
		);
	}

	@Post("register")
	@ApiOperation({ summary: "User registration" })
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: "The user has been successfully registered.",
		type: LoginResponseDto,
	})
	async register(@Body() dto: RegisterDto): Promise<LoginResponseDto> {
		return plainToInstance(
			LoginResponseDto,
			await this.userFacade.register(dto),
		);
	}

	@Get("me")
	@ApiOperation({ summary: "Get current user info" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "The current user info has been successfully retrieved.",
		type: MeDtoResponse,
	})
	@ApiBearerAuth()
	@UseGuards(JwtAuthGuard)
	async me(
		@GetAuthenticatedUser() user: AuthenticatedUser,
	): Promise<MeDtoResponse> {
		const userInfo = await this.userFacade.getMe(user);
		return plainToInstance(MeDtoResponse, userInfo, {
			excludeExtraneousValues: true,
		});
	}

	@Get(":id")
	@ApiOperation({ summary: "Get user by ID" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "The user info has been successfully retrieved.",
		type: UserShortInfoResponseDto,
	})
	async getUserById(
		@Param("id") id: string,
	): Promise<UserShortInfoResponseDto> {
		const userInfo = await this.userFacade.getUserById(id);
		return plainToInstance(UserShortInfoResponseDto, userInfo, {
			excludeExtraneousValues: true,
		});
	}

	@Put("avatar")
	@ApiOperation({ summary: "Upload and update user avatar" })
	@ApiConsumes("multipart/form-data")
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Avatar has been successfully updated.",
		type: UploadAvatarResponseDto,
	})
	@ApiBody({
		type: UploadAvatarDto,
	})
	@ApiBearerAuth()
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FileInterceptor("file"))
	async updateAvatar(
		@GetAuthenticatedUser() user: AuthenticatedUser,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
					new FileTypeValidator({ fileType: ".(png|jpeg|jpg|webp)" }),
				],
			}),
		)
		file: Express.Multer.File,
	): Promise<UploadAvatarResponseDto> {
		if (!file) {
			throw new BadRequestException("File is required");
		}

		const optimizedBuffer = await this.imageService.optimizeAvatar(
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
			file.buffer,
		);
		const uploadResult: UploadApiResponse =
			await this.cloudinaryService.uploadImage(
				optimizedBuffer,
				"avatars",
			);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const newAvatarUrl = uploadResult.secure_url;

		const { oldAvatarUrl } = await this.userFacade.updateAvatar(
			user.id,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			newAvatarUrl,
		);

		if (oldAvatarUrl) {
			const publicId = this.extractPublicId(oldAvatarUrl);
			if (publicId) {
				await this.cloudinaryService.deleteImage(publicId);
			}
		}

		return plainToInstance(
			UploadAvatarResponseDto,
			{ newAvatar: newAvatarUrl },
			{
				excludeExtraneousValues: true,
			},
		);
	}

	private extractPublicId(url: string): string | null {
		try {
			const parts = url.split("/");
			const fileWithExt = parts.at(-1);
			if (!fileWithExt) {
				return null;
			}
			const fileName = fileWithExt.split(".")[0];
			return `avatars/${fileName}`;
		} catch (error) {
			console.error(`Error extracting public ID from URL: ${url}`, error);
			return null;
		}
	}
}
