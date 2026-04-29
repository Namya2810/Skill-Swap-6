const express = require('express');
const router = express.Router();
const { sendMessage, getConversation, getInbox, deleteMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',          protect, getInbox);          // GET  /api/messages         — inbox
router.get('/:userId',   protect, getConversation);   // GET  /api/messages/:userId  — conversation
router.post('/',         protect, sendMessage);        // POST /api/messages          — send
router.delete('/:id',    protect, deleteMessage);      // DELETE /api/messages/:id    — delete

module.exports = router;
