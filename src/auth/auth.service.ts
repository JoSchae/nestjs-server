import {
	Injectable,
	UnauthorizedException,
	NotFoundException,
	InternalServerErrorException,
	BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { UserLoginDto } from 'src/user/model/user-login.dto';
import { CustomLoggerService } from 'src/shared/logger/custom-logger.service';
import { PasswordService } from 'src/shared/password/password.service';
import { RegExpConstants } from 'src/shared/constants/regexp';

@Injectable()
export class AuthService {
	private readonly logger = new CustomLoggerService();

	constructor(
		private userService: UserService,
		private jwtService: JwtService,
		private readonly passwordService: PasswordService,
	) {
		this.logger.setContext('AuthService');
	}

	public async validateUser(email: string, pass: string): Promise<any> {
		this.logger.log('Validating user credentials', {
			email,
			service: 'AuthService',
			method: 'validateUser',
		});

		// Input validation
		if (!email || email.trim() === '') {
			this.logger.warn('Login attempt failed: Empty email provided', {
				service: 'AuthService',
				method: 'validateUser',
			});
			throw new BadRequestException('Email is required');
		}

		if (!pass || pass.trim() === '') {
			this.logger.warn('Login attempt failed: Empty password provided', {
				email,
				service: 'AuthService',
				method: 'validateUser',
			});
			throw new BadRequestException('Password is required');
		}

		// Email format validation
		const emailRegex = new RegExp(RegExpConstants.EMAIL);
		if (!emailRegex.test(email)) {
			this.logger.warn('Login attempt failed: Invalid email format', {
				email,
				service: 'AuthService',
				method: 'validateUser',
			});
			throw new BadRequestException('Invalid email format');
		}

		try {
			const query = { email: email.toLowerCase() };
			const user = await this.userService.findOneByEmail(query);

			if (!user) {
				this.logger.warn('Login attempt failed: User not found', {
					email,
					service: 'AuthService',
					method: 'validateUser',
				});
				throw new UnauthorizedException('Invalid credentials');
			}

			if (!user.isActive) {
				this.logger.warn('Login attempt failed: User account deactivated', {
					email,
					userId: user._id,
					service: 'AuthService',
					method: 'validateUser',
				});
				throw new UnauthorizedException('Invalid credentials');
			}

			const isMatched = await this.comparePasswords(pass, user.password);
			if (!isMatched) {
				this.logger.warn('Login attempt failed: Invalid password', {
					email,
					userId: user._id,
					service: 'AuthService',
					method: 'validateUser',
				});
				throw new UnauthorizedException('Invalid credentials');
			}

			// Update last login
			await this.userService.updateLastLogin(user._id);

			this.logger.log('User validated successfully', {
				email,
				userId: user._id,
				service: 'AuthService',
				method: 'validateUser',
			});

			return user;
		} catch (error) {
			if (
				error instanceof BadRequestException ||
				error instanceof NotFoundException ||
				error instanceof UnauthorizedException
			) {
				throw error;
			}
			this.logger.error('Failed to validate user', error, {
				email,
				service: 'AuthService',
				method: 'validateUser',
			});
			throw error;
		}
	}

	public async generateJwtToken(user: UserLoginDto): Promise<any> {
		this.logger.log('Generating JWT token for user', {
			email: user.email,
			service: 'AuthService',
			method: 'generateJwtToken',
		});

		// Input validation
		if (!user || !user.email) {
			this.logger.warn('JWT token generation failed: Invalid user data', {
				hasUser: !!user,
				hasEmail: !!user?.email,
				service: 'AuthService',
				method: 'generateJwtToken',
			});
			throw new BadRequestException('Valid user data is required for token generation');
		}

		try {
			// Get user with roles for JWT payload
			const userWithRoles = await this.userService.findOneByEmailWithRoles(user.email);

			if (!userWithRoles) {
				this.logger.warn('JWT token generation failed: User not found with roles', {
					email: user.email,
					service: 'AuthService',
					method: 'generateJwtToken',
				});
				throw new NotFoundException(`User with email ${user.email} not found`);
			}

			const roleNames = userWithRoles.roles?.map((role: any) => role.name) || [];
			const permissions =
				userWithRoles.roles
					?.flatMap((role: any) => role.permissions?.map((perm: any) => perm.name) || [])
					.filter((value, index, self) => self.indexOf(value) === index) || [];

			const payload = {
				email: user.email,
				userId: userWithRoles._id.toString(),
				roles: roleNames,
				permissions: permissions,
				isActive: userWithRoles.isActive,
			};

			const accessToken = this.jwtService.sign(payload);

			this.logger.log('JWT token generated successfully', {
				email: user.email,
				userId: userWithRoles._id,
				rolesCount: roleNames.length,
				permissionsCount: permissions.length,
				service: 'AuthService',
				method: 'generateJwtToken',
			});

			return {
				access_token: accessToken,
			};
		} catch (error) {
			if (error instanceof BadRequestException || error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error('Failed to generate JWT token', error, {
				email: user.email,
				service: 'AuthService',
				method: 'generateJwtToken',
			});
			throw new InternalServerErrorException('Failed to generate authentication token');
		}
	}

	private async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
		this.logger.log('Comparing passwords', {
			service: 'AuthService',
			method: 'comparePasswords',
		});

		// Input validation
		if (!password || !hashedPassword) {
			this.logger.warn('Password comparison failed: Missing password data', {
				hasPassword: !!password,
				hasHashedPassword: !!hashedPassword,
				service: 'AuthService',
				method: 'comparePasswords',
			});
			throw new BadRequestException('Both password and hashed password are required for comparison');
		}

		try {
			const isMatch = await this.passwordService.compare(password, hashedPassword);

			this.logger.log('Password comparison completed', {
				isMatch,
				service: 'AuthService',
				method: 'comparePasswords',
			});

			return isMatch;
		} catch (error) {
			this.logger.error('Failed to compare passwords', error, {
				service: 'AuthService',
				method: 'comparePasswords',
			});
			throw new InternalServerErrorException('Authentication processing failed');
		}
	}
}
