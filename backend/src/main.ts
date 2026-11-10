import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { Logger } from "nestjs-pino";
import { json, urlencoded } from "express";
import { RedisIoAdapter } from "./common/adapters/redis-io.adapter";

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
		bodyParser: false,
	});
	app.enableShutdownHooks();

	const redisIoAdapter = new RedisIoAdapter(app);
	await redisIoAdapter.connectToRedis();
	app.useWebSocketAdapter(redisIoAdapter);

	app.use(json({ limit: "10mb" }));
	app.use(urlencoded({ extended: true, limit: "10mb" }));
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
		yamlDocumentUrl: "api-yaml",
	});

	await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
