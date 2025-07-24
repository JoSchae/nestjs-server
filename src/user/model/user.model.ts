import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User {
	@ApiProperty({ description: 'Users first name', example: 'Max' })
	@Prop()
	firstName: string;

	@ApiProperty({ description: 'Users last name', example: 'Mustermann' })
	@Prop()
	lastName: string;

	@ApiProperty({ description: 'Users email', example: 'default@example.com' })
	@Prop({ lowercase: true, unique: true })
	email: string;

	@ApiProperty({ description: 'Users password', example: 'MyVerySecurePassword' })
	@Prop({ select: false })
	password: string;

	@ApiProperty({ description: 'User roles', type: [String] })
	@Prop({ type: [{ type: Types.ObjectId, ref: 'Role' }], default: [] })
	roles: Types.ObjectId[];

	@ApiProperty({ description: 'Whether the user is active', example: true })
	@Prop({ default: true })
	isActive: boolean;

	@ApiProperty({ description: 'Last login timestamp' })
	@Prop()
	lastLogin: Date;
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);
