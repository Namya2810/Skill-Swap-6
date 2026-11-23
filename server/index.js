const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

// Loaded after dotenv so it can read ALLOWED_ORIGINS / CLIENT_URL
const { corsMiddleware, authLimiter, apiLimiter } = require('./middleware/security');

const app = express();

// Hosting platforms (Render, Railway, Vercel) sit behind a proxy; trust it so
// rate limiting sees the real client IP instead of the proxy's IP.
app.set('trust proxy', 1);

app.use(corsMiddleware);
app.use(express.json());
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth',       authLimiter, require('./routes/authRoutes'));
app.use('/api/users',      require('./routes/userRoutes'));
app.use('/api/community',  require('./routes/communityRoutes'));
app.use('/api/peers',      require('./routes/peerRoutes'));
app.use('/api/mentorship', require('./routes/mentorshipRoutes'));
app.use('/api/feedback',   require('./routes/feedbackRoutes'));
app.use('/api/messages',   require('./routes/messageRoutes'));
app.use('/api/posts',      require('./routes/postRoutes'));
app.use('/api/sessions',      require('./routes/sessionRoutes'));
app.use('/api/endorsements',  require('./routes/endorsementRoutes'));

app.get('/', (req, res) => res.json({ message: 'SkillLink API Running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start session reminder cron job (checks every hour)
  const { startReminderCron } = require('./utils/sessionReminder');
  startReminderCron();
});
