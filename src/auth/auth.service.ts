import { Injectable, forwardRef, Inject, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { UserLoginDto } from 'src/user/model/user-login.dto';
import { CustomLoggerService } from 'src/shared/logger/custom-logger.service';

@Injectable()
export class AuthService {
	private readonly logger = new CustomLoggerService();

	constructor(
		@Inject(forwardRef(() => UserService))
		private userService: UserService,
		private jwtService: JwtService,
	) {
		this.logger.setContext('AuthService');
	}

	public async validateUser(email: string, pass: string): Promise<any> {
		this.logger.log(`Validating user with email: ${email}`);
		
		const query = { email: email };
		const user = await this.userService.findOneByEmail(query);
		if (!user) {
			this.logger.warn(`Login attempt failed: User not found for email ${email}`);
			throw new NotFoundException('Email Does not exist');
		}
		if (!user.isActive) {
			this.logger.warn(`Login attempt failed: User account deactivated for email ${email}`);
			throw new UnauthorizedException('User account is deactivated');
		}
		const isMatched = await this.comparePasswords(pass, user.password);
		if (!isMatched) {
			this.logger.warn(`Login attempt failed: Invalid password for email ${email}`);
			throw new UnauthorizedException('Invalid Password');
		}

		// Update last login
		await this.userService.updateLastLogin(user._id);
		this.logger.log(`User validated successfully: ${email}`);

		return user;
	}

	public async generateJwtToken(user: UserLoginDto): Promise<any> {
		this.logger.log(`Generating JWT token for user: ${user.email}`);
		
		// Get user with roles for JWT payload
		const userWithRoles = await this.userService.findOneByEmailWithRoles(user.email);

		const payload = {
			email: user.email,
			sub: userWithRoles._id,
			roles: userWithRoles.roles?.map((role) => role._id) || [],
		};

		this.logger.log(`JWT token generated successfully for user: ${user.email}`, {
			userId: userWithRoles._id,
			rolesCount: payload.roles.length,
		});

		return {
			access_token: this.jwtService.sign(payload),
		};
	}
	public async getHashedPassword(password: string): Promise<any> {
		return new Promise((resolve, reject) => {
			bcrypt.hash(password, 10, (err, hash) => {
				if (err) {
					reject(err);
				}
				resolve(hash);
			});
		});
	}

	private async comparePasswords(password: string, hashedPassword: string): Promise<any> {
		return bcrypt
			.compare(password, hashedPassword)
			.then((isMatch: boolean) => {
				return !!isMatch;
			})
			.catch((err) => err);
	}
}
