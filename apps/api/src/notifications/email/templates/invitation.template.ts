export function generateInvitationTemplate(
  invitationLink: string,
  roleName: string,
  inviterName: string,
  expiryDays: number
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to Admin Panel</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 600px;">

          <!-- Header -->
          <tr>
            <td style="padding: 48px 48px 32px 48px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                🎉 You're Invited!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 48px 48px 32px 48px;">
              <p style="margin: 0 0 24px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hello,
              </p>

              <p style="margin: 0 0 24px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                <strong style="color: #111827;">${inviterName}</strong> has invited you to join the <strong>Admin Panel</strong> with the role:
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <span style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px;">
                  ${roleName}
                </span>
              </div>

              <p style="margin: 0 0 32px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Click the button below to accept your invitation and set up your account:
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 32px 0;">
                    <a href="${invitationLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <div style="padding: 20px; background-color: #f9fafb; border-radius: 8px; margin: 0 0 32px 0;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; font-weight: 600;">
                  Or copy and paste this link:
                </p>
                <p style="margin: 0; word-break: break-all; color: #667eea; font-size: 13px; line-height: 1.6;">
                  ${invitationLink}
                </p>
              </div>

              <!-- Warning Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 24px 0;">
                <tr>
                  <td style="padding: 16px 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      <strong style="color: #78350f;">⏰ Important:</strong> This invitation will expire in <strong>${expiryDays} days</strong>. Please accept it before then.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 48px 48px 48px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                This is an automated email. Please do not reply to this message.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                &copy; ${new Date().getFullYear()} Admin Panel. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
