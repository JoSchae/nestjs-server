import { Injectable, forwardRef, Inject, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/model/user.model';
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
		const isMatched = await this.comparePasswords(pass, user.password);
		if (!isMatched) {
			throw new UnauthorizedException('Invalid Password');
		}
		return user;
	}

	public async generateJwtToken(user: UserLoginDto): Promise<any> {
		const payload = {
			email: user.email,
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
