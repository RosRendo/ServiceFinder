// @ts-nocheck
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface Response<T> {
  data?: T;
  success?: boolean;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log(`${method} ${url} - ${responseTime}ms`);
      }),
      map(data => {
        // If the response is already formatted with success/message, return it
        if (data && typeof data === 'object' && ('success' in data || 'message' in data || 'token' in data)) {
          return data;
        }
        
        // Otherwise, wrap it in a standard data object if it's not null
        return {
          success: true,
          data,
        };
      }),
    );
  }
}

