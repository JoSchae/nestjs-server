import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const PORT = parseInt(process.env.SERVER_PORT, 10) || 3000;

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	// setup OpenApi
	const config = new DocumentBuilder()
		.setTitle('SchaeferDevelopment NestJS API')
		.setDescription('API for SchaeferDevelopment')
		.setVersion('1.0')
		.addTag('SchaeferDevelopment')
		.build();
	const documentFactory = () => SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, documentFactory);

	app.useGlobalPipes(new ValidationPipe());
	await app.listen(PORT);
}
bootstrap();
