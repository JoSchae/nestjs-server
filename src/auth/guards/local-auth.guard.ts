import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../user/model/user.model';

interface PassportInfo {
	message?: string;
	name?: string;
}

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
	handleRequest<TUser = User>(
		err: Error | null,
		user: TUser | false,
		info: PassportInfo | undefined,
		context: ExecutionContext,
		status?: number,
	): TUser {
		if (err) {
			throw err; // Re-throw the original error if it exists
		}

		if (!user) {
			// Handle case where user is null/undefined/false
			const message = info?.message || 'Authentication failed';
			throw new UnauthorizedException(message);
		}

		return user;
	}
}
