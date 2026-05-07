import { Injectable } from "@nestjs/common";
import sharp from "sharp";

@Injectable()
export class ImageService {
	async optimizeAvatar(buffer: Buffer): Promise<Buffer> {
		return await sharp(buffer)
			.resize(500, 500, {
				fit: sharp.fit.contain,
			})
			.webp({ quality: 80 })
			.toBuffer();
	}
}
