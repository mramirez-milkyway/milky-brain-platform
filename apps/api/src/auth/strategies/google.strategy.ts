import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID') || 'placeholder',
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET') || 'placeholder',
      callbackURL:
        configService.get('GOOGLE_CALLBACK_URL') ||
        'http://localhost:4000/api/auth/google/callback',
      scope: ['email', 'profile'],
    })
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ): Promise<void> {
    const { emails, displayName } = profile

    if (!emails || emails.length === 0) {
      done(new Error('No email found in profile'), undefined)
      return
    }

    const user = {
      email: emails[0].value,
      name: displayName || emails[0].value,
    }
    done(null, user)
  }
}
