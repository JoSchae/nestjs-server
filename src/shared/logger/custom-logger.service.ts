import { Injectable, LoggerService } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  userEmail?: string;
  requestMethod?: string;
  requestUrl?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

@Injectable()
export class CustomLoggerService implements LoggerService {
  private context = 'Application';
  private static asyncLocalStorage = new AsyncLocalStorage<LogContext>();

  setContext(context: string) {
    this.context = context;
  }

  static setContext(context: LogContext) {
    this.asyncLocalStorage.enterWith(context);
  }

  static getContext(): LogContext {
    return this.asyncLocalStorage.getStore() || {};
  }

  static generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatMessage(level: string, message: any, optionalParams?: any[]): string {
    const context = CustomLoggerService.getContext();
    const timestamp = new Date().toISOString();
    
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      context: this.context,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      correlationId: context.correlationId,
      userId: context.userId,
      userEmail: context.userEmail,
      requestMethod: context.requestMethod,
      requestUrl: context.requestUrl,
      userAgent: context.userAgent,
      ip: context.ip,
      ...context,
    };

    // Remove undefined values
    Object.keys(logEntry).forEach(key => {
      if (logEntry[key] === undefined) {
        delete logEntry[key];
      }
    });

    if (optionalParams && optionalParams.length > 0) {
      logEntry['additionalData'] = optionalParams;
    }

    return JSON.stringify(logEntry);
  }

  log(message: any, ...optionalParams: any[]) {
    console.log(this.formatMessage('info', message, optionalParams));
  }

  error(message: any, trace?: string, ...optionalParams: any[]) {
    const errorEntry = this.formatMessage('error', message, optionalParams);
    if (trace) {
      const parsedEntry = JSON.parse(errorEntry);
      parsedEntry.trace = trace;
      console.error(JSON.stringify(parsedEntry));
    } else {
      console.error(errorEntry);
    }
  }

  warn(message: any, ...optionalParams: any[]) {
    console.warn(this.formatMessage('warn', message, optionalParams));
  }

  debug(message: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('debug', message, optionalParams));
    }
  }

  verbose(message: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.formatMessage('verbose', message, optionalParams));
    }
  }
}
