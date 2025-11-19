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

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = await this.authService.validateGoogleUser(req.user as any)
    const { access_token } = await this.authService.login(user)

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60 * 1000, // 12 hours
    })

    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000')
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('access_token')
    return res.json({ message: 'Logged out successfully' })
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.userId)
  }

  @Get('me/permissions')
  @UseGuards(JwtAuthGuard)
  async getPermissions(@CurrentUser() user: any) {
    return { permissions: await this.authService.getPermissions(user.userId) }
  }

  @Get('verify-invitation')
  async verifyInvitation(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is required')
    }
    return this.authService.verifyInvitationToken(token)
  }

  @Get('accept-invitation')
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

      const { access_token } = await this.authService.login(user)

      // Clear invitation token cookie
      res.clearCookie('invitation_token')

      // Set auth cookie
      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
      })

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
