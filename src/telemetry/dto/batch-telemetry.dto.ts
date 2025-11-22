import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { TelemetryEventDto } from './telemetry-event.dto';

export class BatchTelemetryDto {
	@ApiProperty({
		description: 'Array of telemetry events (max 1000 per batch)',
		type: [TelemetryEventDto],
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => TelemetryEventDto)
	@ArrayMinSize(1, { message: 'Batch must contain at least 1 event' })
	@ArrayMaxSize(1000, { message: 'Batch cannot exceed 1000 events' })
	events: TelemetryEventDto[];
}
