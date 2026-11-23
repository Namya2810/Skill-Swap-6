/**
 * sessionReminder.js — Cron job that sends email reminders for upcoming sessions
 * Runs every 15 minutes. Sends a "24 hours" reminder once the session is
 * 23–24h away and a "1 hour" reminder once it is 0–1h away. The windows are
 * wider than the cron interval, so no session (e.g. at 10:30) is ever skipped,
 * and the reminder24Sent / reminder1Sent flags stop duplicate emails.
 * Import and call startReminderCron() in server/index.js
 */
const cron = require('node-cron');
const Session = require('../models/Session');
const { sendSessionReminderEmail } = require('./emailService');
const { parseSessionDateTime } = require('./sessionTime');

const startReminderCron = () => {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('[ReminderCron] Checking for upcoming sessions...');
    try {
      const now = new Date();

      // Accepted sessions that still have at least one reminder left to send
      const sessions = await Session.find({
        status: 'Accepted',
        $or: [{ reminder24Sent: { $ne: true } }, { reminder1Sent: { $ne: true } }],
      })
        .populate('requester', 'name email')
        .populate('host', 'name email');

      for (const session of sessions) {
        const sessionDateTime = parseSessionDateTime(session.date, session.time);
        if (isNaN(sessionDateTime)) continue;

        const diffHours = (sessionDateTime - now) / (1000 * 60 * 60);

        const is1h  = diffHours > 0  && diffHours <= 1  && !session.reminder1Sent;
        const is24h = diffHours > 23 && diffHours <= 24 && !session.reminder24Sent;

        if (!is24h && !is1h) continue;

        const hoursUntil = is1h ? 1 : 24;
        const payload = {
          sessionTopic: session.topic,
          sessionDate:  session.date,
          sessionTime:  session.time || '',
          hoursUntil,
        };

        // Send to requester
        if (session.requester?.email) {
          await sendSessionReminderEmail({
            to:       session.requester.email,
            name:     session.requester.name,
            peerName: session.host?.name || 'your mentor',
            ...payload,
          });
        }
        // Send to host
        if (session.host?.email) {
          await sendSessionReminderEmail({
            to:       session.host.email,
            name:     session.host.name,
            peerName: session.requester?.name || 'your student',
            ...payload,
          });
        }

        // Mark as sent so the next run doesn't email again
        await Session.updateOne(
          { _id: session._id },
          { $set: is1h ? { reminder1Sent: true } : { reminder24Sent: true } }
        );
      }
    } catch (err) {
      console.error('[ReminderCron] Error:', err.message);
    }
  });

  console.log('[ReminderCron] Started — checking sessions every 15 minutes');
};

module.exports = { startReminderCron };
