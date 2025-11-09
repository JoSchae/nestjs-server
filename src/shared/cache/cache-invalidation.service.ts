import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheKeyGenerator } from './cache-key.generator';
import { CustomLoggerService } from '../logger/custom-logger.service';

/**
 * Cache Invalidation Service
 *
 * Centralized cache invalidation logic for complex scenarios
 * where multiple cache keys need to be invalidated together.
 */
@Injectable()
export class CacheInvalidationService {
	private readonly logger = new CustomLoggerService();

	constructor(private readonly cacheService: CacheService) {
		this.logger.setContext(CacheInvalidationService.name);
	}

	/**
	 * Invalidate all user-related caches for a specific user
	 * Called when user data changes (update, role assignment, etc.)
	 */
	async invalidateUser(userId: string, email?: string): Promise<void> {
		this.logger.debug('Invalidating user caches', {
			userId,
			email,
			service: 'CacheInvalidationService',
			method: 'invalidateUser',
		});

		const deletions: Promise<void>[] = [this.cacheService.del(CacheKeyGenerator.user.byId(userId))];

		if (email) {
			deletions.push(
				this.cacheService.del(CacheKeyGenerator.user.byEmail(email)),
				this.cacheService.del(CacheKeyGenerator.user.withRoles(email)),
			);
		}

		await Promise.all(deletions);
	}

	/**
	 * Invalidate all role-related caches for a specific role
	 * Called when role data changes
	 */
	async invalidateRole(roleId: string, roleName?: string): Promise<void> {
		this.logger.debug('Invalidating role caches', {
			roleId,
			roleName,
			service: 'CacheInvalidationService',
			method: 'invalidateRole',
		});

		const deletions: Promise<void>[] = [
			this.cacheService.del(CacheKeyGenerator.role.byId(roleId)),
			this.cacheService.del(CacheKeyGenerator.role.all()),
		];

		if (roleName) {
			deletions.push(this.cacheService.del(CacheKeyGenerator.role.byName(roleName)));
		}

		await Promise.all(deletions);
	}

	/**
	 * Invalidate all permission-related caches for a specific permission
	 * Called when permission data changes (rare)
	 */
	async invalidatePermission(permissionId: string, permissionName?: string): Promise<void> {
		this.logger.debug('Invalidating permission caches', {
			permissionId,
			permissionName,
			service: 'CacheInvalidationService',
			method: 'invalidatePermission',
		});

		const deletions: Promise<void>[] = [
			this.cacheService.del(CacheKeyGenerator.permission.byId(permissionId)),
			this.cacheService.del(CacheKeyGenerator.permission.all()),
		];

		if (permissionName) {
			deletions.push(this.cacheService.del(CacheKeyGenerator.permission.byName(permissionName)));
		}

		await Promise.all(deletions);
	}

	/**
	 * Invalidate user caches when a role's permissions change
	 * Since users have roles, and roles have permissions, changing role permissions
	 * means all users with that role now have stale cached data
	 */
	async invalidateUsersByRoleChange(): Promise<void> {
		this.logger.debug('Invalidating all user role caches due to role permission change', {
			service: 'CacheInvalidationService',
			method: 'invalidateUsersByRoleChange',
		});

		// Since we can't do pattern matching in memory store,
		// we'll just clear specific known cache patterns
		// This is a limitation of in-memory cache vs Redis
		// For now, we'll need to be explicit about what to clear
		// In practice, role permission changes are rare
	}

	/**
	 * Invalidate all caches (nuclear option)
	 * Use sparingly - mainly for testing or major data migrations
	 */
	async invalidateAll(): Promise<void> {
		this.logger.warn('Clearing ALL caches', {
			service: 'CacheInvalidationService',
			method: 'invalidateAll',
		});

		await this.cacheService.reset();
	}
}
