import { ExtractJwt, Strategy } from 'passport-jwt';
import { forwardRef, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AdminStrategy extends PassportStrategy(Strategy, 'admin') {
	private readonly logger: Logger = new Logger(AdminStrategy.name);

	constructor(
		@Inject(forwardRef(() => UserService))
		private readonly usersService: UserService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKeyProvider: async (request, rawJwtToken, done) => {
				try {
					const adminUser = await this.usersService.findOneByEmail({ email: 'admin@admin.com' });
					if (!adminUser) {
						this.logger.error('Admin user not found');
						return done(new UnauthorizedException('Admin user not found'), false);
					}
					this.logger.log('Admin user found, using password as secret');
					done(null, adminUser.password);
				} catch (error) {
					this.logger.error('Error fetching admin user', error);
					done(error, false);
				}
			},
			usernameField: 'email',
		});
	}

	async validate(payload: any) {
		this.logger.log('Validate ADMIN:', payload);

		// Check if the email in the payload is the admin email
		if (payload.email !== 'admin@admin.com') {
			this.logger.error('Unauthorized access attempt with email:', payload.email);
			throw new UnauthorizedException('Unauthorized access');
		}

		// Fetch the admin user from the database
		const adminUser = await this.usersService.findOneByEmail({ email: payload.email });
		if (!adminUser) {
			this.logger.error('Admin user not found');
			throw new UnauthorizedException('Admin user not found');
		}

		return adminUser;
	}
}
