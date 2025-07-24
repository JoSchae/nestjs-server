import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Role {
	@ApiProperty({ description: 'Role name', example: 'admin' })
	@Prop({ required: true, unique: true })
	name: string;

	@ApiProperty({ description: 'Role description', example: 'Administrator with full access' })
	@Prop()
	description: string;

	@ApiProperty({ description: 'List of permission IDs', type: [String] })
	@Prop({ type: [{ type: Types.ObjectId, ref: 'Permission' }] })
	permissions: Types.ObjectId[];

	@ApiProperty({ description: 'Whether the role is active', example: true })
	@Prop({ default: true })
	isActive: boolean;
}

export type RoleDocument = Role & Document;

export const RoleSchema = SchemaFactory.createForClass(Role);
