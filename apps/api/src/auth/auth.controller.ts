import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Request, Response } from 'express'
import { SessionService } from './services/session.service'
import { generateCsrfToken } from '../common/utils/csrf.util'
import { JwtService } from '@nestjs/jwt'
import { SkipCsrf } from '../common/decorators/skip-csrf.decorator'

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private sessionService: SessionService,
    private jwtService: JwtService
  ) {}

  @Get('google')
  @SkipCsrf()
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @SkipCsrf()
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      const user = await this.authService.validateGoogleUser(req.user as any)
      const { access_token, refresh_token } = await this.authService.login(
        user,
        req.ip,
        req.headers['user-agent']
      )

      // Set access token cookie
      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
      })

      // Set refresh token cookie
      res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      })

      // Generate and set CSRF token
      const csrfToken = generateCsrfToken()
      const payload = this.jwtService.decode(access_token) as { sub: number; jti: string }

      await this.sessionService.storeCsrfToken(payload.sub, payload.jti, csrfToken)

      // Set CSRF token cookie (not HTTP-only so JS can read it)
      res.cookie('csrf_token', csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
      })

      // Also send in header
      res.setHeader('X-CSRF-Token', csrfToken)

      res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000')
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      const errorMessage = error.message || 'Authentication failed'

      // Map error messages to error codes
      let errorCode = 'auth_failed'
      if (errorMessage.includes('Invalid email domain')) {
        errorCode = 'invalid_domain'
      } else if (errorMessage.includes('No invitation found')) {
        errorCode = 'no_invitation'
      } else if (errorMessage.includes('deactivated')) {
        errorCode = 'account_deactivated'
      }

      return res.redirect(`${frontendUrl}/login?error=${errorCode}`)
    }
  }

  @Post('refresh')
  @SkipCsrf()
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' })
    }

    try {
      const { access_token, refresh_token } = await this.authService.refreshAccessToken(
        refreshToken,
        req.ip,
        req.headers['user-agent']
      )

      // Set new access token cookie
      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
      })

      // Set new refresh token cookie
      res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      })

      // Generate and set new CSRF token
      const csrfToken = generateCsrfToken()
      const payload = this.jwtService.decode(access_token) as { sub: number; jti: string }

      await this.sessionService.storeCsrfToken(payload.sub, payload.jti, csrfToken)

      // Set CSRF token cookie (not HTTP-only so JS can read it)
      res.cookie('csrf_token', csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
      })

      // Also send in header
      res.setHeader('X-CSRF-Token', csrfToken)

      return res.json({
        message: 'Tokens refreshed successfully',
        user: await this.authService.getMe(
          (await this.authService.validateRefreshToken(refreshToken)).userId
        ),
      })
    } catch (error) {
      res.clearCookie('access_token')
      res.clearCookie('refresh_token')
      return res.status(401).json({ message: error.message || 'Invalid refresh token' })
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: any, @Res() res: Response) {
    // Delete CSRF token from Redis
    if (user && user.jti) {
      await this.sessionService.deleteCsrfToken(user.userId, user.jti)
    }

    res.clearCookie('access_token')
    res.clearCookie('refresh_token')
    res.clearCookie('csrf_token')
    return res.json({ message: 'Logged out successfully' })
  }

  @Get('me')
  @SkipCsrf()
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.userId)
  }

  @Get('me/permissions')
  @SkipCsrf()
  @UseGuards(JwtAuthGuard)
  async getPermissions(@CurrentUser() user: any) {
    return { permissions: await this.authService.getPermissions(user.userId) }
  }

  @Get('verify-invitation')
  @SkipCsrf()
  async verifyInvitation(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is required')
    }
    return this.authService.verifyInvitationToken(token)
  }

  @Get('accept-invitation')
  @SkipCsrf()
  @UseGuards(AuthGuard('google'))
  async acceptInvitationAuth(@Query('token') token: string, @Res() res: Response) {
    if (!token) {
      throw new BadRequestException('Token is required')
    }
    // Store token in session for callback
    res.cookie('invitation_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
    })
    // Initiates Google OAuth flow
  }

  @Get('accept-invitation/callback')
  @SkipCsrf()
  @UseGuards(AuthGuard('google'))
  async acceptInvitationCallback(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies?.invitation_token

    if (!token) {
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?error=missing_token`
      )
    }

    try {
      const user = await this.authService.acceptInvitation(token, req.user as any)

      if (!user) {
        throw new Error('Failed to activate user')
      }

      const { access_token, refresh_token } = await this.authService.login(
        user,
        req.ip,
        req.headers['user-agent']
      )

      // Clear invitation token cookie
      res.clearCookie('invitation_token')

      // Set access token cookie
      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
      })

      // Set refresh token cookie
      res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      })

      // Generate and set CSRF token
      const csrfToken = generateCsrfToken()
      const payload = this.jwtService.decode(access_token) as { sub: number; jti: string }

      await this.sessionService.storeCsrfToken(payload.sub, payload.jti, csrfToken)

      // Set CSRF token cookie (not HTTP-only so JS can read it)
      res.cookie('csrf_token', csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
      })

      // Also send in header
      res.setHeader('X-CSRF-Token', csrfToken)

      res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000')
    } catch (error) {
      res.clearCookie('invitation_token')
      const errorMessage = error.message || 'Unknown error'
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?error=${encodeURIComponent(errorMessage)}`
      )
    }
  }
}
