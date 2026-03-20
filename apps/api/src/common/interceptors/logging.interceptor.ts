import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import type { AuthenticatedUser } from '../../auth/strategies/jwt.strategy'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP')

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest()
    const { method, url } = req
    const user = req.user as AuthenticatedUser | undefined
    const start = Date.now()

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(`${method} ${url} — ${Date.now() - start}ms [${user?.id ?? 'anon'}]`)
        },
        error: (err) => {
          this.logger.warn(`${method} ${url} — ${Date.now() - start}ms ERRO:${err?.status ?? 500}`)
        },
      })
    )
  }
}
