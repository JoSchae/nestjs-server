import { ExtractJwt, Strategy } from 'passport-jwt';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	private readonly logger: Logger = new Logger(JwtStrategy.name);

	constructor(
		@Inject(forwardRef(() => UsersService))
		private readonly usersService: UsersService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: 'JWT_SECRET',
			usernameField: 'email',
		});
	}

	async validate(payload: any) {
		this.logger.log('Validate passport:', payload);
		return await this.usersService.findOneByEmail({ email: payload.email });
	}
}
