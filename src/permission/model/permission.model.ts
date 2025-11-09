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

// Performance Indexes
// 1. Compound index for common query: findOne({ name, isActive })
//    Used in: findByName with active filter, permission lookups
PermissionSchema.index({ name: 1, isActive: 1 });

// 2. Single-field index for filtering active permissions
//    Used in: findAll({ isActive: true }), listing available permissions
PermissionSchema.index({ isActive: 1 });

// 3. Compound index for action+resource queries
//    Used in: findOne({ action, resource }), checking permission conflicts
PermissionSchema.index({ action: 1, resource: 1 });

// 4. Compound index for action+resource+isActive queries
//    Used in: finding active permissions by action and resource
PermissionSchema.index({ action: 1, resource: 1, isActive: 1 });

// 5. Single-field indexes for individual filtering
//    Used in: filtering by action or resource separately
PermissionSchema.index({ action: 1 });
PermissionSchema.index({ resource: 1 });
