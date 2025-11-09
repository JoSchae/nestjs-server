import { Controller, Post, Logger, UseGuards, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SkipAuth } from './guards/skipAuth.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserLoginDto } from 'src/user/model/user-login.dto';

@Controller('auth')
export class AuthController {
	private readonly logger: Logger = new Logger(AuthController.name);
	constructor(private readonly authService: AuthService) {}

	@Post('login')
	@SkipAuth()
	@UseGuards(LocalAuthGuard)
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Login with credentials and get a JWT' })
	@ApiBody({ description: 'User data', type: UserLoginDto })
	@ApiResponse({ status: 200, description: 'The user is logged in and JWT was created.' })
	@ApiResponse({ status: 401, description: 'Invalid credentials (generic message for security).' })
	@ApiResponse({ status: 400, description: 'Bad request (invalid input format).' })
	@ApiResponse({ status: 500, description: 'Internal server error.' })
	public async login(@Body() userLoginDto: UserLoginDto): Promise<{ access_token: string }> {
		this.logger.log(`Login attempt for email: ${userLoginDto.email}`);
		return await this.authService.generateJwtToken(userLoginDto);
	}
}
