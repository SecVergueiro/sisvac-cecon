import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { RolesGuard } from "./auth/guards/roles.guard";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { SupabaseModule } from "./config/supabase.module";
import { ServidoresModule } from "./modules/servidores/servidores.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { FeriasModule } from "./modules/ferias/ferias.module";
import { AprovacoesModule } from "./modules/aprovacoes/aprovacoes.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [
        ".env",
        ".env.local",
        "../web/.env.local",
        "../../apps/web/.env.local",
        "../../.env.local",
        "../../.env",
      ],
    }),
    ThrottlerModule.forRoot([{ name: "global", ttl: 60_000, limit: 100 }]),
    SupabaseModule,
    AuthModule,
    ServidoresModule,
    DashboardModule,
    FeriasModule,
    AprovacoesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
