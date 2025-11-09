import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { CacheInvalidationService } from './cache-invalidation.service';
import cacheConfig from '../config/cache.config';

@Module({
	imports: [
		NestCacheModule.registerAsync({
			imports: [ConfigModule.forFeature(cacheConfig)],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				// Use default in-memory store
				ttl: configService.get('cache.ttl.medium') * 1000, // Convert seconds to milliseconds
				max: configService.get('cache.max'), // Maximum number of items in cache
				isGlobal: true, // Make cache available globally
			}),
		}),
	],
	providers: [CacheService, CacheInvalidationService],
	exports: [CacheService, CacheInvalidationService, NestCacheModule],
})
export class CacheModule {}
