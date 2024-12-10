import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { extractTokenFromHeader } from 'src/utils/request.util';
import { IS_PUBLIC_KEY } from './skipAuth.decorator';
import { jwtConstants } from './constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	constructor(
		private jwtService: JwtService,
		private reflector: Reflector,
	) {
		super();
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		if (isPublic) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const token = extractTokenFromHeader(request);
		if (!token) {
			throw new UnauthorizedException();
		}
		try {
			const payload = await this.jwtService.verifyAsync(token, {
				secret: jwtConstants.secret,
			});
			request['user'] = payload;
		} catch (error) {
			throw new UnauthorizedException(error.message);
		}
		return true;
	}
}
