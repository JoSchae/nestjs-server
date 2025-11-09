import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CustomLoggerService } from '../logger/custom-logger.service';

@Injectable()
export class PasswordService {
	private readonly logger = new CustomLoggerService();
	private readonly SALT_ROUNDS = 10;

	constructor() {
		this.logger.setContext(PasswordService.name);
	}

	/**
	 * Hash a plain text password
	 */
	async hash(password: string): Promise<string> {
		this.logger.log('Generating hashed password', {
			service: 'PasswordService',
			method: 'hash',
		});

		// Input validation
		if (!password || password.trim() === '') {
			this.logger.warn('Password hashing failed: Empty password provided', {
				service: 'PasswordService',
				method: 'hash',
			});
			throw new BadRequestException('Password is required');
		}

		// Password strength validation
		if (password.length < 8) {
			this.logger.warn('Password hashing failed: Password too short', {
				passwordLength: password.length,
				service: 'PasswordService',
				method: 'hash',
			});
			throw new BadRequestException('Password must be at least 8 characters long');
		}

		// Password complexity validation
		const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+={}[\]|:;"'<>,.\/\\])/;

		if (!complexityRegex.test(password)) {
			this.logger.warn('Password hashing failed: Password does not meet complexity requirements', {
				service: 'PasswordService',
				method: 'hash',
			});
			throw new BadRequestException('Password must contain uppercase, lowercase, number, and special character');
		}

		try {
			const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
			const hashedPassword = await bcrypt.hash(password, salt);

			this.logger.log('Password hashed successfully', {
				service: 'PasswordService',
				method: 'hash',
			});

			return hashedPassword;
		} catch (error) {
			this.logger.error('Password hashing failed', error, {
				service: 'PasswordService',
				method: 'hash',
			});
			throw new BadRequestException('Failed to hash password');
		}
	}

	/**
	 * Compare plain text password with hashed password
	 */
	async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
		if (!plainPassword || !hashedPassword) {
			this.logger.warn('Password comparison failed: Missing password', {
				hasPlain: !!plainPassword,
				hasHashed: !!hashedPassword,
				service: 'PasswordService',
				method: 'compare',
			});
			return false;
		}

		try {
			const isMatch = await bcrypt.compare(plainPassword, hashedPassword);

			this.logger.log('Password comparison completed', {
				match: isMatch,
				service: 'PasswordService',
				method: 'compare',
			});

			return isMatch;
		} catch (error) {
			this.logger.error('Password comparison failed', error, {
				service: 'PasswordService',
				method: 'compare',
			});
			return false;
		}
	}
}
