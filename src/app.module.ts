import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import mongodbConfig from './shared/config/mongodb.config';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { SeedModule } from './seed/seed.module';
import { MetricsModule } from './metrics/metrics.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { LoggerModule } from './shared/logger/logger.module';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { MetricsInterceptor } from './metrics/metrics.interceptor';
import { LoggingInterceptor } from './shared/logger/logging.interceptor';
import { GlobalExceptionFilter } from './shared/exceptions/global-exception.filter';
import { validate } from './shared/config/environment.validation';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import rateLimitingConfig from './shared/config/rate-limiting.config';
import { CacheModule } from './shared/cache/cache.module';

@Module({
	imports: [
		ScheduleModule.forRoot(),
		CacheModule,
		ThrottlerModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => [
				{
					name: 'global',
					ttl: configService.get('rateLimit.global.ttl'),
					limit: configService.get('rateLimit.global.limit'),
				},
			],
			inject: [ConfigService],
		}),
		ConfigModule.forRoot({
			envFilePath: process.env.ENV_FILE_PATH || '/etc/app/.env',
			isGlobal: true,
			validate,
			load: [mongodbConfig, rateLimitingConfig],
		}),
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				uri: configService.get<string>('mongodb.uri'),
				// Connection Pool Configuration
				maxPoolSize: 10, // Max 10 concurrent connections
				minPoolSize: 5, // Always keep 5 warm connections
				maxIdleTimeMS: 30000, // Close idle connections after 30s
				waitQueueTimeoutMS: 5000, // Wait max 5s for available connection

				// Reliability
				serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB unreachable
				socketTimeoutMS: 45000, // Socket timeout
				family: 4, // Use IPv4

				// Monitoring (logs when connections are created/destroyed)
				autoIndex: false, // Don't create indexes on startup (performance)
			}),
			inject: [ConfigService],
		}),
		AuthModule,
		UserModule,
		RoleModule,
		PermissionModule,
		SeedModule,
		MetricsModule,
		TelemetryModule,
		LoggerModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_FILTER,
			useClass: GlobalExceptionFilter,
		},
		{
			provide: APP_GUARD,
			useClass: JwtAuthGuard,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: LoggingInterceptor,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: MetricsInterceptor,
		},
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}
