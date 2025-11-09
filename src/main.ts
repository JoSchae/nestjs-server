import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CustomLoggerService } from './shared/logger/custom-logger.service';
import { MongoSanitizePipe } from './shared/pipes/mongo-sanitize.pipe';
import * as express from 'express';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';

const PORT = parseInt(process.env.SERVER_PORT, 10) || 3000;

async function bootstrap() {
	const logger = new CustomLoggerService();
	logger.setContext('Bootstrap');

	const nestLogger = new CustomLoggerService();
	nestLogger.setContext('NestApplication');

	const app = await NestFactory.create(AppModule, {
		logger: nestLogger,
	});

	app.enableShutdownHooks();
	const gracefulShutdown = async (signal: string) => {
		logger.log(`Received ${signal}, starting graceful shutdown...`);
		await app.close();
		logger.log('Application closed gracefully');
		process.exit(0);
	};

	process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
	process.on('SIGINT', () => gracefulShutdown('SIGINT'));

	const configService = app.get(ConfigService);

	// Configure request size limits
	app.use(
		express.json({
			limit: configService.get('security.requestLimits.jsonLimit'),
		}),
	);
	app.use(
		express.urlencoded({
			extended: true,
			limit: configService.get('security.requestLimits.urlEncodedLimit'),
		}),
	);
	app.use(
		express.raw({
			limit: configService.get('security.requestLimits.rawLimit'),
		}),
	);

	// Configure CORS
	app.enableCors({
		origin: configService.get('security.cors.origin'),
		credentials: configService.get('security.cors.credentials'),
		methods: configService.get('security.cors.methods'),
		allowedHeaders: configService.get('security.cors.allowedHeaders'),
	});

	app.use(helmet());
	app.use(compression());

	app.use((req: any, res: any, next: any) => {
		const timeoutMs = 30000; // 30 seconds

		req.setTimeout(timeoutMs, () => {
			if (!res.headersSent) {
				logger.warn('Request timeout', {
					method: req.method,
					url: req.url,
					timeout: timeoutMs,
				});

				res.status(408).json({
					success: false,
					error: {
						code: 'REQUEST_TIMEOUT',
						message: 'Request took too long to process',
						timestamp: new Date().toISOString(),
						path: req.url,
						method: req.method,
					},
				});
			}
		});

		next();
	});

	// setup OpenApi
	const openApiConfig = new DocumentBuilder()
		.setTitle('SchaeferDevelopment NestJS API')
		.setDescription('API for SchaeferDevelopment')
		.setVersion('1.0')
		.addBearerAuth()
		.build();
	const documentFactory = () => SwaggerModule.createDocument(app, openApiConfig);
	SwaggerModule.setup('api', app, documentFactory);

	app.useGlobalPipes(
		new MongoSanitizePipe(),
		new ValidationPipe({
			transform: true,
			whitelist: true,
			forbidNonWhitelisted: true,
			disableErrorMessages: process.env.NODE_ENV === 'production',
		}),
	);

	await app.listen(PORT);
	logger.log(`Application is running on: http://localhost:${PORT}`);
	logger.log(`Swagger documentation available at: http://localhost:${PORT}/api`);
	logger.log(`CORS enabled for origins: ${configService.get('security.cors.origin')}`);
}
bootstrap();
