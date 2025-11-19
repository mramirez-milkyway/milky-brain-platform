import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuditService } from '../../common/services/audit.service'
import { generateInvitationTemplate } from './templates/invitation.template'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private resend: any | null = null
  private fromEmail: string

  constructor(
    private configService: ConfigService,
    private auditService: AuditService
  ) {
    this.initializeResend()
    this.fromEmail = this.configService.get<string>('FROM_EMAIL') || 'noreply@example.com'
  }

  private async initializeResend() {
    const apiKey = this.configService.get<string>('RESEND_API_KEY')

    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not configured. Email sending will be disabled.')
      return
    }

    try {
      // Using require for ESM module compatibility
      const ResendModule = require('resend')
      const Resend = ResendModule.Resend || ResendModule.default || ResendModule
      this.resend = new Resend(apiKey)
      this.logger.log('Resend email service initialized')
    } catch (error) {
      this.logger.error('Failed to initialize Resend:', error)
    }
  }

  async sendInvitationEmail(
    to: string,
    token: string,
    roleName: string,
    inviterName: string,
    actorId: number
  ): Promise<boolean> {
    if (!this.resend) {
      this.logger.error('Cannot send email: Resend not configured')
      throw new Error('Email service not configured')
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'
    const invitationLink = `${frontendUrl}/accept-invite?token=${token}`
    const expiryDays = this.configService.get<number>('INVITATION_EXPIRY_DAYS') || 30

    const htmlContent = generateInvitationTemplate(
      invitationLink,
      roleName,
      inviterName,
      expiryDays
    )

    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: "You've been invited to join the Admin Panel",
        html: htmlContent,
      })

      this.logger.log(`Invitation email sent to ${to}, email ID: ${result.data?.id}`)

      // Log to audit trail
      await this.auditService.log({
        actorId,
        action: 'email:invitation_sent',
        entityType: 'user_invitation',
        entityId: to,
        afterState: {
          recipient: to,
          role: roleName,
          emailId: result.data?.id,
        },
      })

      return true
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${to}:`, error)
      throw error
    }
  }
}
