import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';
import { CustomMetricsService } from './custom-metrics.service';

@Module({
	imports: [
		PrometheusModule.register({
			path: '/metrics',
			defaultMetrics: {
				enabled: true,
			},
		}),
	],
	controllers: [MetricsController],
	providers: [CustomMetricsService],
	exports: [CustomMetricsService],
})
export class MetricsModule {}
