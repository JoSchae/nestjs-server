import { Injectable, forwardRef, Inject, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { UserLoginDto } from 'src/user/model/user-login.dto';

@Injectable()
export class AuthService {
	constructor(
		@Inject(forwardRef(() => UserService))
		private userService: UserService,
		private jwtService: JwtService,
	) {}

	public async validateUser(email: string, pass: string): Promise<any> {
		const query = { email: email };
		const user = await this.userService.findOneByEmail(query);
		if (!user) {
			throw new NotFoundException('Email Does not exist');
		}
		if (!user.isActive) {
			throw new UnauthorizedException('User account is deactivated');
		}
		const isMatched = await this.comparePasswords(pass, user.password);
		if (!isMatched) {
			throw new UnauthorizedException('Invalid Password');
		}

		// Update last login
		await this.userService.updateLastLogin(user._id);

		return user;
	}

	public async generateJwtToken(user: UserLoginDto): Promise<any> {
		// Get user with roles for JWT payload
		const userWithRoles = await this.userService.findOneByEmailWithRoles(user.email);

		const payload = {
			email: user.email,
			sub: userWithRoles._id,
			roles: userWithRoles.roles?.map((role) => role._id) || [],
		};
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
