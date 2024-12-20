import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { extractTokenFromHeader } from 'src/utils/request.util';
import { AuthGuard } from '@nestjs/passport';
import { jwtConstants } from './constants';

@Injectable()
export class AdminAuthGuard extends AuthGuard('admin') {
	constructor(
		private jwtService: JwtService,
		private userService: UserService,
	) {
		super();
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = extractTokenFromHeader(request);
		if (!token) {
			throw new UnauthorizedException();
		}

		try {
			// Fetch the specific user (e.g., admin user)
			const adminUser = await this.userService.findOneByEmail({ email: 'admin@admin.com' });
			if (!adminUser) {
				throw new UnauthorizedException('Admin user not found');
			}

			// Verify the token using the admin user's password
			const payload = await this.jwtService.verifyAsync(token, {
				secret: jwtConstants.secret,
			});
			console.log('Payload: ', payload);
			if (payload.email !== adminUser.email) {
				throw new UnauthorizedException('Unauthorized access');
			}
			request['user'] = payload;
		} catch (error) {
			throw new UnauthorizedException(error.message);
		}
		return true;
	}
}
