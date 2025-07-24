import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { PermissionAction, PermissionResource } from '../model/permission.model';

export class CreatePermissionDto {
	@ApiProperty({ description: 'Permission name', example: 'user:read' })
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiProperty({ description: 'Permission description', example: 'Can read user information', required: false })
	@IsString()
	@IsOptional()
	description?: string;

	@ApiProperty({ description: 'Action allowed', enum: PermissionAction })
	@IsEnum(PermissionAction)
	@IsNotEmpty()
	action: PermissionAction;

	@ApiProperty({ description: 'Resource the permission applies to', enum: PermissionResource })
	@IsEnum(PermissionResource)
	@IsNotEmpty()
	resource: PermissionResource;

	@ApiProperty({ description: 'Whether the permission is active', example: true, required: false })
	@IsBoolean()
	@IsOptional()
	isActive?: boolean;
}
