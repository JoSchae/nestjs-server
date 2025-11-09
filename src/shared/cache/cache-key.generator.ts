/**
 * Cache Key Generator
 *
 * Provides consistent, namespaced cache keys for all entities.
 * This prevents key collisions and makes cache invalidation easier.
 */
export class CacheKeyGenerator {
	/**
	 * User-related cache keys
	 */
	static user = {
		byId: (id: string) => `user:id:${id}`,
		byEmail: (email: string) => `user:email:${email}`,
		withRoles: (email: string) => `user:roles:${email}`,
		all: () => 'user:all',
	};

	/**
	 * Role-related cache keys
	 */
	static role = {
		byId: (id: string) => `role:id:${id}`,
		byName: (name: string) => `role:name:${name}`,
		all: () => 'role:all',
	};

	/**
	 * Permission-related cache keys
	 */
	static permission = {
		byId: (id: string) => `permission:id:${id}`,
		byName: (name: string) => `permission:name:${name}`,
		all: () => 'permission:all',
	};
}
