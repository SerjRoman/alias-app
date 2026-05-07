/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { v2 } from "cloudinary";
import { ConfigService } from "@nestjs/config";

export const CLOUDINARY = "Cloudinary";
export const CloudinaryProvider = {
	provide: CLOUDINARY,
	useFactory: (configService: ConfigService) => {
		v2.config({
			cloud_name: configService.getOrThrow("CLOUDINARY_CLOUD_NAME"),
			api_key: configService.getOrThrow("CLOUDINARY_API_KEY"),
			api_secret: configService.getOrThrow("CLOUDINARY_API_SECRET"),
		});

		return v2;
	},
	inject: [ConfigService],
};
