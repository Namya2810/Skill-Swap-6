# ⇌ Skill Swap

> **A peer-to-peer skill exchange platform** — connect with people who know what you want to learn, and want to learn what you know.

🔗 **Live Demo:** [skill-swap.vercel.app](https://skill-swap-6.vercel.app) &nbsp;|&nbsp; Built solo by [Namya Jain](https://github.com/Namya2810)

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on_Vercel-000000?style=flat&logo=vercel&logoColor=white)

---

## What is Skill Swap?

Skill Swap matches people based on what they can teach and what they want to learn. Register as a Mentor, a Learner, or both — the platform automatically places you into the right community and surfaces your best-fit peers using a custom weighted scoring algorithm.

**500+ skills in the dataset · 87% match accuracy · Deployed on Vercel**

---

## Features

### 🤖 Smart Peer Matching
Custom scoring algorithm ranks peers by mutual skill overlap:
- **+3 pts** per skill they can teach you
- **+2 pts** per skill you can teach them
- **+2 pts** community match bonus
- **+1 pt** skill category alignment bonus

### ⬡ Auto Community Assignment
On registration, users are placed into the most suitable community using a **Weighted Jaccard Similarity** algorithm (`skillsOffered` get 30% higher weight than `skillsWanted`) plus category and role balance bonuses.

### 📅 Session Booking + Email Reminders
Request structured learning sessions with any peer. A background **cron job** (runs hourly) automatically sends email reminders at 24h and 1h before each session via Nodemailer.

### 💬 Real-time Messaging
Direct messages between users with a clean, full-featured messaging UI.

### ✅ Skill Endorsements
Peers can endorse each other's skills after sessions, building credibility profiles over time.

### 📰 Community Feed
Post updates, share resources, and celebrate wins within your community group.

### 🌙 Light / Dark Theme
Full theme toggle with persistent preference via React Context.

### 🔐 JWT Authentication
Secure auth with bcrypt password hashing, JWT tokens (7-day expiry), and protected routes on both client and server.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Tailwind CSS, Recharts, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Email | Nodemailer |
| Scheduling | node-cron |
| Deployment | Vercel (frontend + serverless) |

---

## Project Structure

```
Skill-Swap/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/          # Reusable UI (Sidebar, UserCard, SkillRadarChart...)
│   │   ├── context/             # AuthContext, ThemeContext
│   │   ├── pages/               # Landing, Dashboard, Feed, Peers, Mentorship,
│   │   │                        # Messages, Community, Feedback, Profile
│   │   └── api/                 # Axios API client
│   └── vite.config.js
│
└── server/                      # Express backend
    ├── controllers/             # Business logic (10 controllers)
    │   ├── peerController.js    # Smart matching algorithm
    │   ├── communityScoring.js  # Weighted Jaccard + bonus scoring
    │   ├── authController.js    # Register, login, community assignment
    │   ├── sessionController.js # Booking + status management
    │   └── ...
    ├── models/                  # Mongoose schemas (User, Community, Session,
    │                            # Message, MentorshipRequest, Endorsement, Post)
    ├── routes/                  # 10 REST API route files
    ├── utils/
    │   ├── sessionReminder.js   # Hourly cron for email reminders
    │   └── emailService.js      # Nodemailer email templates
    └── index.js                 # Entry point
```

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register + auto community assignment |
| POST | `/api/auth/login` | Login with JWT |
| GET | `/api/peers` | Get ranked peer recommendations |
| POST | `/api/mentorship/request` | Send mentorship request |
| GET/POST | `/api/sessions` | Book / manage sessions |
| GET/POST | `/api/messages` | Direct messaging |
| GET/POST | `/api/posts` | Community feed |
| POST | `/api/endorsements` | Endorse a peer's skill |
| GET | `/api/community` | Community info + members |
| GET/PUT | `/api/users` | User profile management |

---

## Getting Started

### Prerequisites
- Node.js v16+
- MongoDB (local or MongoDB Atlas)

### Installation

```bash
# Clone the repo
git clone https://github.com/Namya2810/Skill-Swap-6.git
cd Skill-Swap-6

# Backend setup
cd server
npm install
cp .env.example .env        # Fill in your values
npm run dev                 # Runs on port 5000

# Frontend setup (new terminal)
cd ../client
npm install
npm run dev                 # Runs on port 5173
```

### Environment Variables (server/.env)

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
PORT=5000
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

Optional: `EMAIL_HOST` (default `smtp.gmail.com`), `EMAIL_PORT` (`587`), `EMAIL_FROM` and `CLIENT_URL` (`http://localhost:5173`, used in email links).

---

## How the Matching Algorithm Works

When you log in, Skill Swap fetches all other users and scores them:

```js
// From peerController.js
const computePeerScore = (me, other) => {
  const teachMe    = theirOffered ∩ myWanted   // +3 per skill
  const iTeach     = myOffered ∩ theirWanted   // +2 per skill
  const community  = sameCommunity ? +2 : 0    // community bonus
  const category   = sharedCategory ? +1 : 0   // category bonus
  return teachMe.length*3 + iTeach.length*2 + community + category
}
```

Users are ranked by total score, and the breakdown (what they can teach you, what you can teach them) is shown on each peer card.

---

## Highlights

- **Solo built** — full-stack from scratch: schema design, REST API, auth, matching algorithm, cron jobs, frontend UI
- **10 REST API routes** covering auth, peers, sessions, messages, posts, endorsements, mentorship, feedback, community, and user management
- **Custom scoring logic** in `communityScoring.js` using Weighted Jaccard Similarity + category and role balance bonuses
- **Automated email reminders** via cron — no manual triggers needed
- **Deployed live** on Vercel with client-server architecture

---

## Author

**Namya Jain** — MCA student at Thapar Institute of Engineering and Technology  
Minor in AI & ML — IIT Ropar  
[GitHub](https://github.com/Namya2810) · [LinkedIn](https://linkedin.com/in/YOUR-LINK) · [jainnamya2810@gmail.com](mailto:jainnamya2810@gmail.com)

---

*Built with ❤️ as a solo project — March 2026*
