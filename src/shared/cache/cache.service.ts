import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { CustomLoggerService } from '../logger/custom-logger.service';

/**
 * Cache Service Wrapper
 *
 * Provides a clean abstraction over the cache-manager library with:
 * - Logging for cache hits/misses
 * - Type-safe operations
 * - Cache-aside pattern support
 */
@Injectable()
export class CacheService {
	private readonly logger = new CustomLoggerService();

	constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
		this.logger.setContext(CacheService.name);
	}

	/**
	 * Get a value from cache
	 */
	async get<T>(key: string): Promise<T | undefined> {
		try {
			const value = await this.cacheManager.get<T>(key);

			if (value !== undefined && value !== null) {
				this.logger.debug(`Cache HIT: ${key}`, {
					key,
					service: 'CacheService',
					method: 'get',
				});
			} else {
				this.logger.debug(`Cache MISS: ${key}`, {
					key,
					service: 'CacheService',
					method: 'get',
				});
			}

			return value;
		} catch (error) {
			this.logger.error(`Cache GET error for key: ${key}`, error, {
				key,
				service: 'CacheService',
				method: 'get',
			});
			return undefined;
		}
	}

	/**
	 * Set a value in cache
	 * @param key Cache key
	 * @param value Value to cache
	 * @param ttl Time to live in seconds (optional, uses default if not provided)
	 */
	async set(key: string, value: any, ttl?: number): Promise<void> {
		try {
			const ttlMs = ttl ? ttl * 1000 : undefined;
			await this.cacheManager.set(key, value, ttlMs);

			this.logger.debug(`Cache SET: ${key}`, {
				key,
				ttl: ttl || 'default',
				service: 'CacheService',
				method: 'set',
			});
		} catch (error) {
			this.logger.error(`Cache SET error for key: ${key}`, error, {
				key,
				service: 'CacheService',
				method: 'set',
			});
		}
	}

	/**
	 * Delete a value from cache
	 */
	async del(key: string): Promise<void> {
		try {
			await this.cacheManager.del(key);

			this.logger.debug(`Cache DEL: ${key}`, {
				key,
				service: 'CacheService',
				method: 'del',
			});
		} catch (error) {
			this.logger.error(`Cache DEL error for key: ${key}`, error, {
				key,
				service: 'CacheService',
				method: 'del',
			});
		}
	}

	/**
	 * Clear all cache
	 */
	async reset(): Promise<void> {
		try {
			// @ts-ignore - reset exists but not in types
			await this.cacheManager.store.reset();

			this.logger.log('Cache cleared completely', {
				service: 'CacheService',
				method: 'reset',
			});
		} catch (error) {
			this.logger.error('Cache RESET error', error, {
				service: 'CacheService',
				method: 'reset',
			});
		}
	}

	/**
	 * Cache-aside pattern implementation
	 *
	 * This is the most useful method - it handles the cache logic for you:
	 * 1. Try to get from cache
	 * 2. If not in cache, execute the function
	 * 3. Store the result in cache
	 * 4. Return the result
	 *
	 * @param key Cache key
	 * @param fn Function to execute if cache miss
	 * @param ttl Time to live in seconds (optional)
	 */
	async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
		try {
			// Try to get from cache
			const cached = await this.get<T>(key);
			if (cached !== undefined && cached !== null) {
				return cached;
			}

			// Cache miss - execute function
			this.logger.debug(`Cache WRAP executing function for: ${key}`, {
				key,
				service: 'CacheService',
				method: 'wrap',
			});

			const result = await fn();

			// Store in cache
			if (result !== undefined && result !== null) {
				await this.set(key, result, ttl);
			}

			return result;
		} catch (error) {
			this.logger.error(`Cache WRAP error for key: ${key}`, error, {
				key,
				service: 'CacheService',
				method: 'wrap',
			});
			// On error, execute the function without caching
			return fn();
		}
	}
}
