import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────
export const register = (data) => API.post('/auth/register', data);
export const login    = (data) => API.post('/auth/login', data);

// ── User ──────────────────────────────────────────
export const getProfile   = ()     => API.get('/users/profile');
export const updateProfile = (data) => API.put('/users/profile', data);
export const getAllUsers   = ()     => API.get('/users');

// ── Community ─────────────────────────────────────
export const getMyCommunity           = ()     => API.get('/community');
export const getAllCommunities         = ()     => API.get('/community/all');
export const getRecommendedCommunities = ()    => API.get('/community/recommend');
export const joinCommunity            = (data) => API.put('/community/join', data);
export const createCommunity          = (data) => API.post('/community/create', data);

// ── Peers ─────────────────────────────────────────
export const getRecommendations = () => API.get('/peers/recommend');

// ── Mentorship ────────────────────────────────────
export const sendMentorshipRequest = (data) => API.post('/mentorship/request', data);
export const respondToRequest      = (data) => API.put('/mentorship/respond', data);
export const getMentorshipRequests = ()     => API.get('/mentorship');

// ── Feedback ──────────────────────────────────────
export const submitFeedback = (data) => API.post('/feedback', data);
export const getFeedback    = ()     => API.get('/feedback');

// ── Messages (NEW) ────────────────────────────────
export const getInbox        = ()           => API.get('/messages');
export const getConversation = (userId)     => API.get(`/messages/${userId}`);
export const sendMessage     = (data)       => API.post('/messages', data);
export const deleteMessage   = (id)         => API.delete(`/messages/${id}`);

// ── Posts (NEW) ───────────────────────────────────
export const getPosts    = ()           => API.get('/posts');
export const createPost  = (data)       => API.post('/posts', data);
export const reactToPost = (id, emoji)  => API.put(`/posts/${id}/react`, { emoji });
export const addComment  = (id, text)   => API.post(`/posts/${id}/comment`, { text });
export const deletePost  = (id)         => API.delete(`/posts/${id}`);

// ── Sessions ──────────────────────────────────────
export const getSessions       = ()           => API.get('/sessions');
export const requestSession    = (data)       => API.post('/sessions/request', data);
export const respondToSession  = (id, status) => API.put(`/sessions/${id}/respond`, { status });
export const completeSession   = (id)         => API.put(`/sessions/${id}/complete`);

export default API;

// ── Endorsements ──────────────────────────────────
export const endorseSkill     = (data)    => API.post('/endorsements', data);
export const getEndorsements  = (userId)  => API.get(`/endorsements/${userId}`);
