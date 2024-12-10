import { ExtractJwt, Strategy } from 'passport-jwt';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserService } from 'src/user/user.service';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
	private readonly logger: Logger = new Logger(JwtStrategy.name);

	constructor(
		@Inject(forwardRef(() => UserService))
		private readonly usersService: UserService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: jwtConstants.secret,
			usernameField: 'email',
		});
	}

	async validate(payload: any) {
		this.logger.log('Validate passport:', payload);
		return await this.usersService.findOneByEmail({ email: payload.email });
	}
}
