import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserDto {
	@ApiProperty({ description: 'User first name', example: 'John' })
	@IsString()
	@IsNotEmpty()
	firstName: string;

	@ApiProperty({ description: 'User last name', example: 'Doe' })
	@IsString()
	@IsNotEmpty()
	lastName: string;

	@ApiProperty({ description: 'User email address', example: 'john.doe@example.com' })
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty({ description: 'User password', example: 'SecurePassword123!' })
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	password: string;

	@ApiProperty({ description: 'Whether the user is active', example: true, required: false })
	@IsBoolean()
	@IsOptional()
	isActive?: boolean;
}
