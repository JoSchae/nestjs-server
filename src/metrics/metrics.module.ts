import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';
import { CustomMetricsService } from './custom-metrics.service';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';

@Module({
	imports: [
		PrometheusModule.register({
			path: '/metrics',
			defaultMetrics: {
				enabled: true,
			},
		}),
		AuthModule,
		UserModule,
	],
	controllers: [MetricsController],
	providers: [CustomMetricsService],
	exports: [CustomMetricsService],
})
export class MetricsModule {}
