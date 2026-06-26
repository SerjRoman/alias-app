import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { Logger } from "nestjs-pino";

async function bootstrap() {
	const isProd = process.env.NODE_ENV === "production";
	const app = await NestFactory.create(AppModule, {
		bufferLogs: true,
		cors: {
			origin: isProd
				? (process.env.FRONTEND_URL ??
					"https://alias-app-frontend.vercel.app")
				: "*",
			credentials: true,
		},
	});
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
		}),
	);
	app.useLogger(app.get(Logger));

	const config = new DocumentBuilder()
		.setTitle("API Docs")
		.setDescription("API Docs description")
		.setVersion("1.0")
		.addBearerAuth()
		.build();
	const documentFactory = () => SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("api-docs", app, documentFactory, {
		swaggerOptions: {
			persistAuthorization: true,
		},
		raw: ["yaml"],
	});

	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
