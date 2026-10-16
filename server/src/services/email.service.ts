import { Resend } from 'resend';
import { config } from '../config';
import { formatINR } from '../utils/formatters';

const resend = new Resend(config.RESEND_API_KEY);

export async function sendVerificationEmail(to: string, fullName: string, token: string): Promise<boolean> {
  const verifyUrl = `${config.APP_URL}/verify-email?token=${token}`;
  
  if (config.NODE_ENV === 'development' && config.RESEND_API_KEY.includes('mock')) {
    console.log(`\n📧 [DEV EMAIL] Verification Link for ${to} (${fullName}):\n${verifyUrl}\n`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: config.EMAIL_FROM,
      to,
      replyTo: config.EMAIL_REPLY_TO,
      subject: 'Verify your email address - CyberForge Academy',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0A0F1C; color: #E5E7EB; padding: 40px; border-radius: 8px;">
          <h2 style="color: #22D3EE;">Welcome to CyberForge Academy, ${fullName}!</h2>
          <p style="font-size: 16px; line-height: 1.5;">Please confirm your email address to activate your account and start your cybersecurity journey.</p>
          <div style="margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #22D3EE; color: #0A0F1C; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #94A3B8; font-size: 14px;">This link will expire in 24 hours. If you did not register for CyberForge Academy, you can safely ignore this email.</p>
        </div>
      `,
    });
    if (error) {
      console.error('Failed to send verification email via Resend:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Resend email exception:', err);
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, fullName: string, token: string): Promise<boolean> {
  const resetUrl = `${config.APP_URL}/reset-password?token=${token}`;

  if (config.NODE_ENV === 'development' && config.RESEND_API_KEY.includes('mock')) {
    console.log(`\n📧 [DEV EMAIL] Password Reset Link for ${to}:\n${resetUrl}\n`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: config.EMAIL_FROM,
      to,
      replyTo: config.EMAIL_REPLY_TO,
      subject: 'Reset your password - CyberForge Academy',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0A0F1C; color: #E5E7EB; padding: 40px; border-radius: 8px;">
          <h2 style="color: #22D3EE;">Password Reset Request</h2>
          <p>Hi ${fullName}, we received a request to reset your password.</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #22D3EE; color: #0A0F1C; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #94A3B8; font-size: 14px;">This link will expire in 30 minutes. If you did not request this, please secure your account immediately.</p>
        </div>
      `,
    });
    if (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Resend reset email exception:', err);
    return false;
  }
}

export async function sendPaymentReceiptEmail(
  to: string,
  fullName: string,
  courseTitle: string,
  amountInPaise: number,
  paymentId: string
): Promise<boolean> {
  const formatted = formatINR(amountInPaise, true);

  if (config.NODE_ENV === 'development' && config.RESEND_API_KEY.includes('mock')) {
    console.log(`\n📧 [DEV EMAIL] Payment Receipt for ${to}: ${courseTitle} (${formatted}, ID: ${paymentId})\n`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: config.EMAIL_FROM,
      to,
      replyTo: config.EMAIL_REPLY_TO,
      subject: `Payment Receipt: ${courseTitle} - CyberForge Academy`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0A0F1C; color: #E5E7EB; padding: 40px; border-radius: 8px;">
          <h2 style="color: #22D3EE;">Payment Confirmed</h2>
          <p>Hi ${fullName}, thank you for your enrollment in <strong>${courseTitle}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; color: #E5E7EB;">
            <tr><td style="padding: 8px 0; color: #94A3B8;">Amount Paid:</td><td style="font-weight: bold; color: #22C55E;">${formatted}</td></tr>
            <tr><td style="padding: 8px 0; color: #94A3B8;">Payment ID:</td><td>${paymentId}</td></tr>
          </table>
          <p>You can access your live sessions and recordings directly from your Student Dashboard.</p>
        </div>
      `,
    });
    return !error;
  } catch (err) {
    console.error('Failed to send payment receipt:', err);
    return false;
  }
}

export async function sendSubscriptionNoticeEmail(
  to: string,
  fullName: string,
  status: string,
  details?: string
): Promise<boolean> {
  if (config.NODE_ENV === 'development' && config.RESEND_API_KEY.includes('mock')) {
    console.log(`\n📧 [DEV EMAIL] Subscription Notice for ${to}: Status ${status} (${details || ''})\n`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: config.EMAIL_FROM,
      to,
      replyTo: config.EMAIL_REPLY_TO,
      subject: `Teacher Subscription Update: ${status} - CyberForge Academy`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0A0F1C; color: #E5E7EB; padding: 40px; border-radius: 8px;">
          <h2 style="color: #22D3EE;">Teacher Subscription Notice</h2>
          <p>Hi ${fullName}, your teacher platform subscription status is now: <strong>${status}</strong>.</p>
          ${details ? `<p style="color: #94A3B8;">${details}</p>` : ''}
          <p>Remember that an active subscription is required to publish courses and host live interactive classes.</p>
        </div>
      `,
    });
    return !error;
  } catch (err) {
    console.error('Failed to send subscription notice:', err);
    return false;
  }
}

export async function sendTestEmail(to: string): Promise<{ success: boolean; message: string }> {
  try {
    const result = await resend.emails.send({
      from: config.EMAIL_FROM,
      to,
      replyTo: config.EMAIL_REPLY_TO,
      subject: 'CyberForge Academy - Resend DNS Verification Test',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0A0F1C; color: #E5E7EB; padding: 30px; border-radius: 8px;">
          <h2 style="color: #22D3EE;">CyberForge Academy Email Test</h2>
          <p>This is a test email sent from the CyberForge Academy CLI verification tool.</p>
          <p style="color: #22C55E; font-weight: bold;">✔ Resend API key and DNS records (SPF, DKIM, DMARC) are functioning correctly!</p>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 20px;">Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    });
    if (result.error) {
      return { success: false, message: result.error.message };
    }
    return { success: true, message: `Email successfully delivered with ID ${result.data?.id}` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Unknown error' };
  }
}
