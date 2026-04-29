/**
 * sessionReminder.js — Cron job that sends email reminders for upcoming sessions
 * Runs every hour, checks for sessions 24h and 1h away (±15 min window).
 * Import and call startReminderCron() in server/index.js
 */
const cron = require('node-cron');
const Session = require('../models/Session');
const { sendSessionReminderEmail } = require('./emailService');

const startReminderCron = () => {
  // Run every hour at :00
  cron.schedule('0 * * * *', async () => {
    console.log('[ReminderCron] Checking for upcoming sessions...');
    try {
      const now = new Date();

      // Fetch all Accepted sessions in the future
      const sessions = await Session.find({ status: 'Accepted' })
        .populate('requester', 'name email')
        .populate('host', 'name email');

      for (const session of sessions) {
        // Parse session datetime from date string + time string
        const sessionDateTime = new Date(`${session.date}T${session.time || '00:00'}`);
        if (isNaN(sessionDateTime)) continue;

        const diffMs = sessionDateTime - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        // 24h window: 23.75h – 24.25h
        const is24h = diffHours >= 23.75 && diffHours <= 24.25;
        // 1h window:  0.75h – 1.25h
        const is1h  = diffHours >= 0.75  && diffHours <= 1.25;

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
      }
    } catch (err) {
      console.error('[ReminderCron] Error:', err.message);
    }
  });

  console.log('[ReminderCron] Started — checking sessions every hour');
};

module.exports = { startReminderCron };
