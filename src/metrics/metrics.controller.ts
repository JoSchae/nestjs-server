import { Controller, Get, UseGuards, Header } from '@nestjs/common';
import { RequireRoles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { register } from 'prom-client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Metrics')
@ApiBearerAuth()
@Controller('metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles('monitoring', 'admin', 'super_admin')
export class MetricsController {
	@Get()
	@Header('Content-Type', register.contentType)
	@ApiOperation({ summary: 'Get Prometheus metrics for monitoring' })
	@ApiResponse({ status: 200, description: 'Prometheus metrics in text format.' })
	async getMetrics(): Promise<string> {
		return await register.metrics();
	}
}
