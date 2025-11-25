import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import { SessionService } from '../services/session.service'
import { PrismaClient } from '@prisma/client'

interface JwtPayload {
  sub: number
  email: string
  jti?: string
  iat?: number
  exp?: number
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private sessionService: SessionService,
    private prisma: PrismaClient
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.['access_token'] || null
        },
      ]),
      secretOrKey: configService.get('JWT_SECRET') || 'default-secret-change-this',
      ignoreExpiration: false,
    })
  }

  async validate(
    payload: JwtPayload
  ): Promise<{ userId: number; email: string; roleIds: number[] }> {
    // Check if token is blacklisted
    if (payload.jti) {
      const isBlacklisted = await this.sessionService.isTokenBlacklisted(payload.jti)
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked')
      }
    }

    // Fetch user's role IDs
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: payload.sub },
      select: { roleId: true },
    })

    const roleIds = userRoles.map((ur) => ur.roleId)

    console.log(
      '[DEBUG] JWT Strategy - userId:',
      payload.sub,
      'email:',
      payload.email,
      'roleIds:',
      roleIds
    )

    return { userId: payload.sub, email: payload.email, roleIds }
  }
}
