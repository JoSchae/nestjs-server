import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { CanActivate } from '@nestjs/common';
import { Request } from 'express';
import { extractTokenFromHeader } from 'src/utils/request.util';
import { IS_PUBLIC_KEY } from './skipAuth.decorator';
import { JwtPayload } from '../types/jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(
		private jwtService: JwtService,
		private reflector: Reflector,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (isPublic) {
			return true;
		}

		const request = context.switchToHttp().getRequest<Request>();
		const token = extractTokenFromHeader(request);

		if (!token) {
			throw new UnauthorizedException('No token provided');
		}

		try {
			const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

			// Verify user is still active
			if (payload.isActive === false) {
				throw new UnauthorizedException('User account is deactivated');
			}

			// Attach full payload to request
			(request as any).user = payload;
		} catch (error) {
			throw new UnauthorizedException(`Invalid token: ${error.message}`);
		}

		return true;
	}
}
