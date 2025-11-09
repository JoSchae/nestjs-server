import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../types/jwt-payload.interface';

interface RequestWithUser extends Request {
	user: JwtPayload;
}

@Injectable()
export class RolesGuard implements CanActivate {
	private readonly logger = new Logger(RolesGuard.name);

	constructor(private reflector: Reflector) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!requiredRoles || requiredRoles.length === 0) {
			this.logger.log('No roles required for this route');
			return true;
		}

		const request: RequestWithUser = context.switchToHttp().getRequest();
		const user: JwtPayload = request.user;

		if (!user || !user.email) {
			this.logger.warn('User not authenticated or missing email');
			throw new ForbiddenException('User not authenticated');
		}

		try {
			// Get roles directly from JWT payload (no database query needed!)
			const userRoles: string[] = user.roles || [];

			// Check for super admin role
			if (userRoles.includes('super_admin')) {
				this.logger.log(`Super admin access granted for user: ${user.email}`);
				return true;
			}

			// Check if user has any of the required roles
			const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));

			if (!hasRequiredRole) {
				this.logger.warn(
					`Insufficient role access for user: ${user.email}. User roles: ${userRoles.join(', ')}, Required: ${requiredRoles.join(', ')}`,
				);
				throw new ForbiddenException(`Insufficient role access. Required roles: ${requiredRoles.join(', ')}`);
			}

			this.logger.log(`Role check successful for user: ${user.email}, roles: ${requiredRoles.join(', ')}`);
			return true;
		} catch (error) {
			if (error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error checking roles for user: ${user.email}`, error.stack);
			throw new ForbiddenException('Error validating roles');
		}
	}
}
