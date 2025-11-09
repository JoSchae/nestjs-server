import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional, IsBoolean, Matches } from 'class-validator';
import { RegExpConstants } from 'src/shared/constants/regexp';

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

	@ApiProperty({
		description:
			'User password (min 8 characters, must contain uppercase, lowercase, number and special character)',
		example: 'SecurePassword123!',
	})
	@IsString()
	@IsNotEmpty()
	@MinLength(8, { message: 'Password must be at least 8 characters long' })
	@Matches(new RegExp(RegExpConstants.PASSWORD), {
		message:
			'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%*?&#^()_-+={}[]|:;"\'<>,./)\\)',
	})
	password: string;

	@ApiProperty({ description: 'Whether the user is active', example: true, required: false })
	@IsBoolean()
	@IsOptional()
	isActive?: boolean;
}
