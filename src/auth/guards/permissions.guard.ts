import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserService } from '../../user/user.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
	private readonly logger = new Logger(PermissionsGuard.name);

	constructor(
		private reflector: Reflector,
		private userService: UserService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!requiredPermissions) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const user = request.user;

		if (!user) {
			throw new ForbiddenException('User not authenticated');
		}

		// Get user with populated roles and permissions
		const userWithRoles = await this.userService.findOneByEmailWithRoles(user.email);
		if (!userWithRoles) {
			throw new ForbiddenException('User not found');
		}

		// Extract all permissions from user's roles
		const userPermissions = new Set<string>();

		for (const role of userWithRoles.roles || []) {
			for (const permission of role.permissions || []) {
				userPermissions.add(permission.name);

				// Check for super admin permission
				if (permission.name === 'all:manage') {
					return true;
				}
			}
		}

		// Check if user has all required permissions
		const hasAllPermissions = requiredPermissions.every((permission) => userPermissions.has(permission));

		if (!hasAllPermissions) {
			throw new ForbiddenException(`Insufficient permissions. Required: ${requiredPermissions.join(', ')}`);
		}

		return true;
	}
}
