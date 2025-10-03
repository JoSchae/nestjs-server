import { Global, Module } from '@nestjs/common';
import { CustomLoggerService } from './custom-logger.service';
import { LoggingInterceptor } from './logging.interceptor';

@Global()
@Module({
  providers: [CustomLoggerService, LoggingInterceptor],
  exports: [CustomLoggerService, LoggingInterceptor],
})
export class LoggerModule {}
