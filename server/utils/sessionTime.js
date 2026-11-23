/**
 * Sessions are stored as plain strings: date "YYYY-MM-DD" and time "HH:MM".
 * Those strings are the user's local time (IST by default). Without an explicit
 * offset, `new Date()` would read them in the SERVER's timezone (usually UTC in
 * the cloud), which shifts every session by 5.5 hours.
 *
 * SESSION_TZ_OFFSET (env, optional) sets the offset, e.g. "+05:30" (default).
 */
const TZ_OFFSET = process.env.SESSION_TZ_OFFSET || '+05:30';

function parseSessionDateTime(date, time = '00:00') {
  return new Date(`${date}T${time || '00:00'}:00${TZ_OFFSET}`);
}

module.exports = { parseSessionDateTime };
