import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';
import { TelemetryEvent, TelemetryEventSchema } from './schemas/telemetry-event.schema';
import { MetricsModule } from 'src/metrics/metrics.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: TelemetryEvent.name, schema: TelemetryEventSchema }]),
		ScheduleModule.forRoot(),
		ThrottlerModule,
		MetricsModule,
	],
	controllers: [TelemetryController],
	providers: [TelemetryService],
	exports: [TelemetryService],
})
export class TelemetryModule {}
