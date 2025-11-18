import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'

interface JwtPayload {
  sub: number
  email: string
  iat?: number
  exp?: number
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
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
    return { userId: payload.sub, email: payload.email }
  }
}
