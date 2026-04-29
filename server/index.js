const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',       require('./routes/authRoutes'));
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
