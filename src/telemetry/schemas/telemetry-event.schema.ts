import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Schema({ timestamps: true, collection: 'telemetry_events' })
export class TelemetryEvent extends Document {
	@ApiPropertyOptional({ description: 'User ID' })
	@Prop({ index: true })
	userId?: string;

	@ApiPropertyOptional({ description: 'Session ID' })
	@Prop({ index: true })
	sessionId?: string;

	@ApiProperty({ description: 'Event timestamp' })
	@Prop({ required: true })
	timestamp: Date;

	@ApiProperty({ description: 'Event type' })
	@Prop({ required: true, index: true })
	eventType: string;

	@ApiPropertyOptional({ description: 'Application name' })
	@Prop({ index: true })
	appName?: string;

	@ApiPropertyOptional({ description: 'Application version' })
	@Prop()
	appVersion?: string;

	@ApiPropertyOptional({ description: 'Operating system' })
	@Prop()
	os?: string;

	@ApiPropertyOptional({ description: 'Platform/environment' })
	@Prop()
	platform?: string;

	@ApiPropertyOptional({ description: 'Additional metadata' })
	@Prop({ type: Object })
	metadata?: Record<string, any>;

	@ApiProperty({ description: 'Created at timestamp' })
	createdAt: Date;

	@ApiProperty({ description: 'Updated at timestamp' })
	updatedAt: Date;
}

export const TelemetryEventSchema = SchemaFactory.createForClass(TelemetryEvent);

// Compound indexes for common queries
TelemetryEventSchema.index({ userId: 1, timestamp: -1 });
TelemetryEventSchema.index({ appName: 1, timestamp: -1 });
TelemetryEventSchema.index({ eventType: 1, timestamp: -1 });

// TTL index - automatically delete events older than 12 months (365 days)
TelemetryEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });
