import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class UserLoginDto {
	@ApiProperty({ example: 'user@example.com', description: 'The email of the user' })
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty({ example: 'password123', description: 'The password of the user' })
	@IsString()
	@IsNotEmpty()
	password: string;
}
