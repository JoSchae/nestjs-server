import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '../../user/model/user.model';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
	private readonly logger: Logger = new Logger(LocalStrategy.name);

	constructor(private authService: AuthService) {
		super({ usernameField: 'email' });
	}

	async validate(email: string, password: string): Promise<User> {
		const user = await this.authService.validateUser(email, password);
		this.logger.log('User validated successfully in local strategy', {
			userId: user._id,
			email: user.email,
		});
		return user;
	}
}
