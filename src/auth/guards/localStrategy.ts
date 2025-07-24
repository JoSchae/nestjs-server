import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
	private readonly logger: Logger = new Logger(LocalStrategy.name);
	constructor(private authService: AuthService) {
		super({ usernameField: 'email' });
	}

	async validate(email: string, password: string): Promise<any> {
		const user = await this.authService.validateUser(email, password);
		this.logger.log('Logged In User, checking at local auth:', user);
		return user;
	}
}
