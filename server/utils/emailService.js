/**
 * emailService.js — SkillLink email notifications via Nodemailer
 * Configure: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM in .env
 * If not configured, emails are silently skipped (dev-friendly).
 */
const nodemailer = require('nodemailer');

let _transporter = null;
const getTransporter = () => {
  if (_transporter) return _transporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS ||
      process.env.EMAIL_USER === 'your_gmail@gmail.com') return null;
  _transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  return _transporter;
};

const wrapHtml = (body) => `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f1f5fb;margin:0;padding:0}
  .wrap{max-width:540px;margin:32px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(30,60,120,0.10);overflow:hidden}
  .header{background:linear-gradient(135deg,#2563eb,#4f46e5);padding:28px 32px;text-align:center}
  .logo{color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px}
  .logo span{color:#93c5fd}
  .body{padding:32px;color:#1e3a5f;line-height:1.7}
  .body h2{margin:0 0 16px;font-size:20px;color:#0f1f3d}
  .detail{background:#f1f5fb;border-radius:10px;padding:16px 20px;margin:20px 0;border-left:4px solid #2563eb}
  .detail p{margin:5px 0;font-size:14px;color:#2d4a7a}
  .detail strong{color:#0f1f3d}
  .btn{display:inline-block;margin:20px 0;padding:13px 28px;background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px}
  .footer{text-align:center;padding:18px 32px;font-size:12px;color:#8fa8cc;border-top:1px solid #e4ecf7}
</style></head><body>
<div class="wrap">
  <div class="header"><div class="logo">Skill<span>Link</span></div>
  <div style="color:#bfdbfe;font-size:12px;margin-top:4px;font-family:monospace">PEER LEARNING</div></div>
  <div class="body">${body}</div>
  <div class="footer">You received this because you have a session on SkillLink.<br/>© 2025 SkillLink</div>
</div></body></html>`;

const sendMail = async ({ to, subject, html }) => {
  const t = getTransporter();
  if (!t) { console.log(`[Email] Skipped (not configured) → ${to} | ${subject}`); return; }
  try {
    await t.sendMail({ from: process.env.EMAIL_FROM || 'SkillLink <noreply@skilllink.app>', to, subject, html });
    console.log(`[Email] Sent → ${to}`);
  } catch (err) { console.error(`[Email] Failed → ${to}:`, err.message); }
};

const sendSessionReminderEmail = async ({ to, name, sessionTopic, sessionDate, sessionTime, peerName, hoursUntil }) => {
  const label = hoursUntil <= 1 ? '1 hour' : '24 hours';
  await sendMail({
    to, subject: `⏰ Reminder: SkillLink session in ${label} — "${sessionTopic}"`,
    html: wrapHtml(`
      <h2>Session Reminder ⏰</h2>
      <p>Hi <strong>${name}</strong>, your session starts in <strong>${label}</strong>.</p>
      <div class="detail">
        <p><strong>Topic:</strong> ${sessionTopic}</p>
        <p><strong>With:</strong> ${peerName}</p>
        <p><strong>Date:</strong> ${sessionDate}</p>
        <p><strong>Time:</strong> ${sessionTime}</p>
      </div>
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/mentorship" class="btn">View Session →</a>
    `),
  });
};

const sendSessionConfirmationEmail = async ({ to, name, sessionTopic, sessionDate, sessionTime, peerName, role }) => {
  const roleLabel = role === 'host' ? 'hosting' : 'attending';
  await sendMail({
    to, subject: `✅ Session Confirmed — "${sessionTopic}" on ${sessionDate}`,
    html: wrapHtml(`
      <h2>Session Confirmed! 🎉</h2>
      <p>Hi <strong>${name}</strong>, you're ${roleLabel} this session.</p>
      <div class="detail">
        <p><strong>Topic:</strong> ${sessionTopic}</p>
        <p><strong>${role === 'host' ? 'Student' : 'Mentor'}:</strong> ${peerName}</p>
        <p><strong>Date:</strong> ${sessionDate}</p>
        <p><strong>Time:</strong> ${sessionTime}</p>
      </div>
      <p>You'll receive reminder emails 24h and 1h before the session.</p>
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/mentorship" class="btn">View Session →</a>
    `),
  });
};

module.exports = { sendSessionReminderEmail, sendSessionConfirmationEmail };
