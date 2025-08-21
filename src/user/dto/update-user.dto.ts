import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength, IsBoolean } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
	@ApiProperty({ description: 'User first name', example: 'John', required: false })
	@IsString()
	@IsOptional()
	firstName?: string;

	@ApiProperty({ description: 'User last name', example: 'Doe', required: false })
	@IsString()
	@IsOptional()
	lastName?: string;

	@ApiProperty({ description: 'User email address', example: 'john.doe@example.com', required: false })
	@IsEmail()
	@IsOptional()
	email?: string;

	@ApiProperty({ description: 'User password', example: 'SecurePassword123!', required: false })
	@IsString()
	@IsOptional()
	@MinLength(8)
	password?: string;

	@ApiProperty({ description: 'Whether the user is active', example: true, required: false })
	@IsBoolean()
	@IsOptional()
	isActive?: boolean;
}
