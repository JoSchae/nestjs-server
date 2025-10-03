import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CustomLoggerService } from './shared/logger/custom-logger.service';

const PORT = parseInt(process.env.SERVER_PORT, 10) || 3000;

async function bootstrap() {
	const logger = new CustomLoggerService();
	logger.setContext('Bootstrap');
	
	const nestLogger = new CustomLoggerService();
	nestLogger.setContext('NestApplication');
	
	const app = await NestFactory.create(AppModule, {
		logger: nestLogger,
	});
	
	// setup OpenApi
	const config = new DocumentBuilder()
		.setTitle('SchaeferDevelopment NestJS API')
		.setDescription('API for SchaeferDevelopment')
		.setVersion('1.0')
		.addBearerAuth()
		.build();
	const documentFactory = () => SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, documentFactory);

	app.useGlobalPipes(new ValidationPipe());
	
	await app.listen(PORT);
	logger.log(`🚀 Application is running on: http://localhost:${PORT}`);
	logger.log(`📚 Swagger documentation available at: http://localhost:${PORT}/api`);
}
bootstrap();
