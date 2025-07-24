import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserService } from '../../user/user.service';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private userService: UserService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!requiredRoles) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const user = request.user;

		if (!user) {
			throw new ForbiddenException('User not authenticated');
		}

		// Get user with populated roles
		const userWithRoles = await this.userService.findOneByEmailWithRoles(user.email);
		if (!userWithRoles) {
			throw new ForbiddenException('User not found');
		}

		// Extract role names from user's roles
		const userRoles = userWithRoles.roles?.map((role) => role.name) || [];

		// Check for super admin role
		if (userRoles.includes('super_admin')) {
			return true;
		}

		// Check if user has any of the required roles
		const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));

		if (!hasRequiredRole) {
			throw new ForbiddenException(`Insufficient role access. Required roles: ${requiredRoles.join(', ')}`);
		}

		return true;
	}
}
