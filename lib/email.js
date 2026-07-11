/**
 * Email delivery for RemoteMedicalJobs
 * Supports SMTP (Nodemailer). In development without SMTP, emails are logged + saved to /emails-outbox.
 */
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const OUTBOX_DIR = path.join(__dirname, '..', 'emails-outbox');

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
        transporter = nodemailer.createTransport({
            host,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user, pass }
        });
        console.log('Email: SMTP transport configured.');
    } else {
        console.warn('Email: SMTP not configured. Course emails will be saved to emails-outbox/ and logged.');
    }
    return transporter;
}

function ensureOutbox() {
    if (!fs.existsSync(OUTBOX_DIR)) {
        fs.mkdirSync(OUTBOX_DIR, { recursive: true });
    }
}

async function sendMail({ to, subject, html, text }) {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@remotemedicaljobs.com';
    const payload = { from, to, subject, html, text: text || stripHtml(html) };

    ensureOutbox();
    const safeTo = String(to).replace(/[^a-zA-Z0-9@._-]/g, '_');
    const fileName = `${Date.now()}-${safeTo}.html`;
    fs.writeFileSync(
        path.join(OUTBOX_DIR, fileName),
        `<!-- To: ${to} | Subject: ${subject} -->\n${html}`,
        'utf8'
    );

    const transport = getTransporter();
    if (!transport) {
        console.log(`[EMAIL DEV] To: ${to} | Subject: ${subject} | Saved: emails-outbox/${fileName}`);
        return { success: true, mode: 'outbox', file: fileName };
    }

    try {
        const info = await transport.sendMail(payload);
        console.log(`[EMAIL SENT] To: ${to} | MessageId: ${info.messageId}`);
        return { success: true, mode: 'smtp', messageId: info.messageId };
    } catch (err) {
        console.error('[EMAIL ERROR]', err.message);
        // Still succeeded to outbox for recovery
        return { success: false, mode: 'outbox', error: err.message, file: fileName };
    }
}

function stripHtml(html) {
    return String(html || '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function courseEmailHtml({ firstName, productName, amount, reference, accessUrl, modules }) {
    const moduleList = (modules || [])
        .map((m, i) => `<li style="margin-bottom:8px"><strong>Module ${i + 1}:</strong> ${escapeHtml(m.title)} <span style="color:#64748b">(${escapeHtml(m.duration)})</span></li>`)
        .join('');

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;color:#1e293b">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;max-width:600px;width:100%">
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a8a,#059669);padding:28px 32px;color:#fff">
            <div style="font-size:18px;font-weight:700">RemoteMedical<span style="color:#6ee7b7">Jobs</span></div>
            <div style="font-size:13px;opacity:.85;margin-top:4px">Global Remote Healthcare Career Platform</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <h1 style="margin:0 0 12px;font-size:22px;color:#0f172a">Welcome, ${escapeHtml(firstName)}! 🎉</h1>
            <p style="margin:0 0 16px;line-height:1.6;color:#475569">
              Your payment of <strong>$${Number(amount).toFixed(2)} USD</strong> for
              <strong>${escapeHtml(productName)}</strong> was successful. Your course access is ready.
            </p>
            <p style="margin:0 0 24px;line-height:1.6;color:#475569">
              Reference: <code style="background:#f1f5f9;padding:2px 8px;border-radius:6px">${escapeHtml(reference)}</code>
            </p>
            <div style="text-align:center;margin:28px 0">
              <a href="${escapeHtml(accessUrl)}" style="display:inline-block;background:linear-gradient(135deg,#059669,#047857);color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:10px">
                Open Your Course Portal →
              </a>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center">
              Bookmark this link — it is your personal lifetime access URL.
            </p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0">
            <h2 style="font-size:16px;margin:0 0 12px;color:#0f172a">What's included</h2>
            <ul style="padding-left:20px;margin:0 0 20px;color:#475569;line-height:1.5">
              ${moduleList}
              <li style="margin-bottom:8px"><strong>Bonus:</strong> Remote-ready CV template + interview checklist</li>
              <li style="margin-bottom:8px"><strong>Bonus:</strong> Telehealth compliance quick-reference (HIPAA / GDPR / global privacy)</li>
            </ul>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;margin-top:16px">
              <div style="font-weight:700;color:#1d4ed8;margin-bottom:6px">Next steps</div>
              <ol style="margin:0;padding-left:18px;color:#334155;font-size:14px;line-height:1.6">
                <li>Open the course portal and complete Module 1 today</li>
                <li>Download your CV template and update your profile</li>
                <li>Browse remote roles on the job board and apply with confidence</li>
              </ol>
            </div>
            <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.6">
              Questions? Reply to this email or contact
              <a href="mailto:hello@remotemedicaljobs.com" style="color:#2563eb">hello@remotemedicaljobs.com</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#0f172a;padding:20px 32px;color:rgba(255,255,255,.5);font-size:12px;text-align:center">
            © ${new Date().getFullYear()} RemoteMedicalJobs · Global remote healthcare careers<br>
            You received this because you purchased course access.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function contactNotifyHtml({ firstName, lastName, email, inquiryType, message }) {
    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1e293b">
      <h2>New contact form submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Type:</strong> ${escapeHtml(inquiryType)}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;background:#f1f5f9;padding:16px;border-radius:8px">${escapeHtml(message)}</pre>
    </body></html>`;
}

function contactAutoReplyHtml({ firstName }) {
    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1e293b;line-height:1.6">
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>Thanks for contacting <strong>RemoteMedicalJobs</strong>. We received your message and will reply within 1 business day.</p>
      <p>Meanwhile, explore remote roles at our <a href="${process.env.PUBLIC_BASE_URL || 'http://localhost:3000'}/jobs.html">job board</a>
      or the <a href="${process.env.PUBLIC_BASE_URL || 'http://localhost:3000'}/course.html">Career Accelerator</a>.</p>
      <p>— RemoteMedicalJobs Team</p>
    </body></html>`;
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

module.exports = {
    sendMail,
    courseEmailHtml,
    contactNotifyHtml,
    contactAutoReplyHtml,
    escapeHtml
};
