import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import { SessionService } from '../services/session.service'

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
    private sessionService: SessionService
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

  async validate(payload: JwtPayload): Promise<{ userId: number; email: string }> {
    // Check if token is blacklisted
    if (payload.jti) {
      const isBlacklisted = await this.sessionService.isTokenBlacklisted(payload.jti)
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked')
      }
    }

    return { userId: payload.sub, email: payload.email }
  }
}
