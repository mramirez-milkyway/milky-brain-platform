import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { RolesModule } from './roles/roles.module'
import { PoliciesModule } from './policies/policies.module'
import { SettingsModule } from './settings/settings.module'
import { AuditModule } from './audit/audit.module'
import { NotificationsModule } from './notifications/notifications.module'
import { NavigationModule } from './navigation/navigation.module'
import { AuditInterceptor } from './common/interceptors/audit.interceptor'
import { AuditService } from './common/services/audit.service'

@Module({
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
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    AuditService,
  ],
})
export class AppModule {}
