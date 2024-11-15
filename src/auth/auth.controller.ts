import { Controller, Post, Logger, Request, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
	private readonly logger: Logger = new Logger(AuthController.name);
	constructor(private readonly authService: AuthService) {}

	@Post('login')
	@UseGuards(LocalAuthGuard)
	async login(@Request() req): Promise<any> {
		try {
			return await this.authService.generateJwtToken(req.user);
		} catch (error) {
			throw error;
		}
	}

	@UseGuards(JwtAuthGuard)
	@Get('viewProfile')
	async getUser(@Request() req): Promise<any> {
		return req.user;
	}
}
