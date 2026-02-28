import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { cors: { origin: "*" } });
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
		}),
	);

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
