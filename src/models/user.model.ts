import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

@Schema()
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
	S;

	@ApiProperty({ description: 'Users password', example: 'MyVerySecurePassword' })
	@Prop({ select: false })
	password: string;
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);
