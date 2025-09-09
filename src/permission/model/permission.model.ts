import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export enum PermissionAction {
	CREATE = 'create',
	READ = 'read',
	UPDATE = 'update',
	DELETE = 'delete',
	MANAGE = 'manage', // Full access
}

export enum PermissionResource {
	USER = 'user',
	ROLE = 'role',
	PERMISSION = 'permission',
	METRICS = 'metrics',
	ALL = 'all', // All resources
}

@Schema({ timestamps: true })
export class Permission {
	@ApiProperty({ description: 'Permission name', example: 'user:read' })
	@Prop({ required: true, unique: true })
	name: string;

	@ApiProperty({ description: 'Permission description', example: 'Can read user information' })
	@Prop()
	description: string;

	@ApiProperty({ description: 'Action allowed', enum: PermissionAction })
	@Prop({ required: true, enum: PermissionAction })
	action: PermissionAction;

	@ApiProperty({ description: 'Resource the permission applies to', enum: PermissionResource })
	@Prop({ required: true, enum: PermissionResource })
	resource: PermissionResource;

	@ApiProperty({ description: 'Whether the permission is active', example: true })
	@Prop({ default: true })
	isActive: boolean;
}

export type PermissionDocument = Permission & Document;

export const PermissionSchema = SchemaFactory.createForClass(Permission);
