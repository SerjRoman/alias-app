import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { Readable } from "node:stream";

@Injectable()
export class CloudinaryService {
	async uploadImage(
		fileBuffer: Buffer,
		folder: string = "avatars",
	): Promise<UploadApiResponse> {
		return new Promise((resolve, reject) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			const uploadStream = cloudinary.uploader.upload_stream(
				{ folder },
				(
					// Используем стандартный Error (или any),
					// так как типы Cloudinary могут конфликтовать
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					error: any,
					result: any,
				) => {
					if (error || !result) {
						return reject(
							new InternalServerErrorException(
								"Error during image upload",
							),
						);
					}
					resolve(result);
				},
			);

			Readable.from(fileBuffer).pipe(uploadStream);
		});
	}

	async deleteImage(publicId: string): Promise<void> {
		try {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			await cloudinary.uploader.destroy(publicId);
		} catch (error) {
			console.error(`Error deleting from Cloudinary: ${publicId}`, error);
		}
	}
}
