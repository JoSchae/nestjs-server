import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserService } from 'src/user/user.service';
import { User } from '../../user/model/user.model';
import { jwtConstants } from './constants';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
	email: string;
	sub: string; // user ID
	roles: string[];
	iat?: number;
	exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
	private readonly logger: Logger = new Logger(JwtStrategy.name);

	constructor(
		private readonly usersService: UserService,
		private configService: ConfigService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: configService.get<string>('JWT_SECRET') || jwtConstants.secret,
		});
	}

	async validate(payload: JwtPayload): Promise<User> {
		this.logger.log('Validating JWT payload', {
			email: payload.email,
			userId: payload.sub,
			rolesCount: payload.roles?.length || 0,
		});

		return await this.usersService.findOneByEmail({ email: payload.email });
	}
}
