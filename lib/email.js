import nodemailer from 'nodemailer';

/**
 * Creates and returns a Nodemailer transporter configured for Gmail or generic SMTP.
 */
function getTransporter() {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, '') // remove spaces from Google app password
    }
  });
}

/**
 * Get the target admin email recipient
 */
export function getAdminEmail() {
  return process.env.ADMIN_EMAIL || process.env.GMAIL_USER || 'jryusif@dashboard.com';
}

/**
 * Check if Gmail SMTP is configured
 */
export function isEmailConfigured() {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
  return Boolean(user && pass);
}

/**
 * Send an email notification to the Admin when a user registers and requests access.
 */
export async function sendAdminSignupNotification({ user, requestInfo = {} }) {
  const transporter = getTransporter();
  const adminEmail = getAdminEmail();

  const formattedDate = new Date().toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  if (!transporter) {
    console.warn(`[Gmail Notification] SMTP credentials not set in .env (GMAIL_USER / GMAIL_APP_PASSWORD). Notification for ${user.email} logged only to console & database.`);
    return {
      sent: false,
      reason: 'SMTP not configured in .env (Add GMAIL_USER and GMAIL_APP_PASSWORD to receive Gmail alerts).'
    };
  }

  const siteUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0f17; color: #e2e8f0; margin: 0; padding: 24px; }
        .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; max-width: 560px; margin: 0 auto; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); padding: 24px 28px; text-align: left; }
        .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; }
        .header p { margin: 4px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px; }
        .content { padding: 28px; }
        .badge { display: inline-block; background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 16px 0 24px; background: rgba(255,255,255,0.03); border-radius: 10px; overflow: hidden; }
        .info-table td { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; }
        .info-table tr:last-child td { border-bottom: none; }
        .info-label { color: #94a3b8; width: 35%; font-weight: 500; }
        .info-val { color: #f8fafc; font-weight: 600; }
        .btn { display: inline-block; background: #0ea5e9; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-align: center; }
        .btn:hover { background: #0284c7; }
        .footer { padding: 18px 28px; background: #0a0f1d; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>⚡ New User Access Request</h1>
          <p>Personal Dashboard Security Gatekeeper</p>
        </div>
        <div class="content">
          <span class="badge">⏳ Pending Approval</span>
          <p style="margin-top:0; font-size: 15px; line-height: 1.5; color: #cbd5e1;">
            A new user has registered and is requesting access to your Personal Dashboard workspace. No data access will be granted until you approve them.
          </p>

          <table class="info-table">
            <tr>
              <td class="info-label">Full Name:</td>
              <td class="info-val">${user.name || 'Not provided'}</td>
            </tr>
            <tr>
              <td class="info-label">Email Address:</td>
              <td class="info-val">${user.email}</td>
            </tr>
            <tr>
              <td class="info-label">Requested At:</td>
              <td class="info-val">${formattedDate}</td>
            </tr>
            <tr>
              <td class="info-label">User ID:</td>
              <td class="info-val" style="font-family: monospace; font-size: 12px;">${user.id}</td>
            </tr>
            ${requestInfo.ip ? `
            <tr>
              <td class="info-label">IP Address:</td>
              <td class="info-val" style="font-family: monospace; font-size: 12px;">${requestInfo.ip}</td>
            </tr>` : ''}
          </table>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${siteUrl}" class="btn" target="_blank">
              👑 Open Admin Control Center
            </a>
          </div>
        </div>
        <div class="footer">
          This is an automated security dispatch from your Personal Dashboard.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Personal Dashboard Security" <${process.env.GMAIL_USER || process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `🚨 [Access Request] New Signup: ${user.name || user.email} awaits your approval`,
      text: `New user registration request:\n\nName: ${user.name || 'N/A'}\nEmail: ${user.email}\nDate: ${formattedDate}\nUser ID: ${user.id}\n\nPlease sign in to your Admin Center to approve or reject this request: ${siteUrl}`,
      html: htmlContent
    });

    console.log(`[Gmail Notification] Successfully sent access request alert to ${adminEmail} (Msg ID: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Gmail Notification] Error sending notification email:', err);
    return { sent: false, error: err.message };
  }
}

/**
 * Send an email to the user when their account has been approved by the Admin.
 */
export async function sendUserApprovalNotification({ user, approved = true }) {
  const transporter = getTransporter();
  if (!transporter || !user.email) return { sent: false, reason: 'SMTP not configured' };

  const siteUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000';

  const subject = approved
    ? '🎉 Your Access Has Been Approved! Welcome to Personal Dashboard'
    : 'ℹ️ Update Regarding Your Personal Dashboard Access';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0f17; color: #e2e8f0; margin: 0; padding: 24px; }
        .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; max-width: 540px; margin: 0 auto; overflow: hidden; }
        .header { background: ${approved ? 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)' : '#334155'}; padding: 24px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; }
        .content { padding: 28px; font-size: 15px; line-height: 1.6; color: #cbd5e1; }
        .btn { display: inline-block; background: #10b981; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 8px; margin-top: 16px; }
        .footer { padding: 16px; background: #0a0f1d; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>${approved ? '🎉 Access Granted' : 'ℹ️ Account Status Update'}</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${user.name || user.email}</strong>,</p>
          ${approved ? `
            <p>Great news! The administrator has approved your registration. You now have full access to your personalized cloud workspace.</p>
            <p>You can now sign in to track your workouts, dental cases, roadmaps, routines, and personal tasks.</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${siteUrl}" class="btn" target="_blank">🚀 Launch Personal Dashboard</a>
            </div>
          ` : `
            <p>We are writing to inform you that your request for workspace access was reviewed and declined by the administrator at this time.</p>
            <p>If you believe this was in error, please contact the administrator directly.</p>
          `}
        </div>
        <div class="footer">
          Personal Dashboard Security
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Personal Dashboard" <${process.env.GMAIL_USER || process.env.SMTP_USER}>`,
      to: user.email,
      subject,
      text: approved
        ? `Hello ${user.name || user.email},\n\nYour account has been approved! You can now log in at: ${siteUrl}`
        : `Hello ${user.name || user.email},\n\nYour access request was declined by the administrator.`,
      html: htmlContent
    });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Gmail Notification] Error sending user status email:', err);
    return { sent: false, error: err.message };
  }
}

/**
 * Verify Gmail SMTP connection and send a test email.
 */
export async function testSmtpConnection() {
  const transporter = getTransporter();
  const adminEmail = getAdminEmail();

  if (!transporter) {
    return {
      ok: false,
      error: 'Gmail credentials not configured in .env. Please set GMAIL_USER and GMAIL_APP_PASSWORD.'
    };
  }

  try {
    await transporter.verify();
    
    // Send a live test email
    const info = await transporter.sendMail({
      from: `"Personal Dashboard Test" <${process.env.GMAIL_USER || process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: '✅ Gmail SMTP Connection Verified - Personal Dashboard',
      text: 'Congratulations! Your Gmail SMTP configuration is fully operational and ready to send instant signup alerts.',
      html: `
        <div style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 480px;">
          <h2 style="color: #38bdf8; margin-top: 0;">✅ Gmail SMTP Test Successful</h2>
          <p style="color: #94a3b8; font-size: 14px;">Your Gmail notification service is working properly. You will receive real-time email alerts whenever a new user requests registration.</p>
          <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `
    });

    return {
      ok: true,
      message: `SMTP verified! Test email successfully sent to ${adminEmail}`,
      messageId: info.messageId
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message || 'Failed to verify SMTP credentials'
    };
  }
}
