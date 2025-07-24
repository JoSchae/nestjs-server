import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { Types } from 'mongoose';

export class CreateRoleDto {
	@ApiProperty({ description: 'Role name', example: 'admin' })
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiProperty({ description: 'Role description', example: 'Administrator with full access', required: false })
	@IsString()
	@IsOptional()
	description?: string;

	@ApiProperty({ description: 'List of permission IDs', type: [String], required: false })
	@IsArray()
	@IsOptional()
	permissions?: Types.ObjectId[];

	@ApiProperty({ description: 'Whether the role is active', example: true, required: false })
	@IsBoolean()
	@IsOptional()
	isActive?: boolean;
}
