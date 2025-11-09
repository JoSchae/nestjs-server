import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { JwtPayload } from '../types/jwt-payload.interface';

interface RequestWithUser extends Request {
	user: JwtPayload;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
	private readonly logger = new Logger(PermissionsGuard.name);

	constructor(private reflector: Reflector) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!requiredPermissions || requiredPermissions.length === 0) {
			this.logger.log('No permissions required for this route');
			return true;
		}

		const request: RequestWithUser = context.switchToHttp().getRequest();
		const user: JwtPayload = request.user;

		if (!user || !user.email) {
			this.logger.warn('User not authenticated or missing email');
			throw new ForbiddenException('User not authenticated');
		}

		try {
			// Get permissions directly from JWT payload (no database query needed!)
			const userPermissions = new Set<string>(user.permissions || []);

			// Check for super admin permission
			if (userPermissions.has('all:manage')) {
				this.logger.log(`Super admin access granted for user: ${user.email}`);
				return true;
			}

			// Check if user has all required permissions
			const hasAllPermissions = requiredPermissions.every((permission) => userPermissions.has(permission));

			if (!hasAllPermissions) {
				const missingPermissions = requiredPermissions.filter((permission) => !userPermissions.has(permission));
				this.logger.warn(
					`Insufficient permissions for user: ${user.email}. Missing: ${missingPermissions.join(', ')}`,
				);
				throw new ForbiddenException(`Insufficient permissions. Required: ${requiredPermissions.join(', ')}`);
			}

			this.logger.log(
				`Permission check successful for user: ${user.email}, permissions: ${requiredPermissions.join(', ')}`,
			);
			return true;
		} catch (error) {
			if (error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error checking permissions for user: ${user.email}`, error.stack);
			throw new ForbiddenException('Error validating permissions');
		}
	}
}
