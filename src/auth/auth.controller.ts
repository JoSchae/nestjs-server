import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './public-strategy';
import { BaseUser } from 'src/dto/base-user.dto';

@Controller('auth')
// @ApiTags('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Public()
	@HttpCode(HttpStatus.OK)
	@Post('login')
	@ApiOperation({ summary: 'User Login' })
	@ApiResponse({ status: HttpStatus.OK, description: 'User logged in successfully', type: [BaseUser] })
	signUp(@Body() signUpDto: Record<string, any>) {
		const payload = {
			username: signUpDto.username,
			email: signUpDto.email,
			password: signUpDto.password,
			createdAt: new Date(),
		};
		return this.authService.signUp(payload);
	}
}
