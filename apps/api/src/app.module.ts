import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { APP_INTERCEPTOR, APP_GUARD, APP_FILTER } from '@nestjs/core'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { RolesModule } from './roles/roles.module'
import { PoliciesModule } from './policies/policies.module'
import { SettingsModule } from './settings/settings.module'
import { AuditModule } from './audit/audit.module'
import { NotificationsModule } from './notifications/notifications.module'
import { NavigationModule } from './navigation/navigation.module'
import { ExportControlsModule } from './export-controls/export-controls.module'
import { PdfModule } from './pdf/pdf.module'
import { InfluencersModule } from './influencers/influencers.module'
import { IntegrationsModule } from './integrations/integrations.module'
import { JobsModule } from './jobs/jobs.module'
import { SystemHealthModule } from './system-health/system-health.module'
import { CreatorsModule } from './creators/creators.module'
import { AgenciesModule } from './agencies/agencies.module'
import { AuditInterceptor } from './common/interceptors/audit.interceptor'
import { AuditService } from './common/services/audit.service'
import { RedisService } from './common/services/redis.service'
import { ActivityTrackingMiddleware } from './common/middleware/activity-tracking.middleware'
import { CsrfGuard } from './common/guards/csrf.guard'
import { SessionService } from './auth/services/session.service'
import { HealthController } from './health/health.controller'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'

@Module({
  controllers: [HealthController],
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 50,
      },
    ]),

    // App modules
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PoliciesModule,
    SettingsModule,
    AuditModule,
    NotificationsModule,
    NavigationModule,
    ExportControlsModule,
    PdfModule,
    InfluencersModule,
    IntegrationsModule,
    JobsModule,
    SystemHealthModule,
    CreatorsModule,
    AgenciesModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    AuditService,
    RedisService,
    SessionService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ActivityTrackingMiddleware).forRoutes('*')
  }
}
