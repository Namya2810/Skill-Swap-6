const express = require('express');
const router = express.Router();
const { sendMessage, getConversation, getInbox, deleteMessage } = require('../controllers/messageController');
const { idParam, sendMessageRules } = require('../middleware/validators');
const { protect } = require('../middleware/authMiddleware');

router.get('/',          protect, getInbox);          // GET  /api/messages         — inbox
router.get('/:userId',   protect, idParam('userId'), getConversation);   // GET  /api/messages/:userId  — conversation
router.post('/',         protect, sendMessageRules, sendMessage);        // POST /api/messages          — send
router.delete('/:id',    protect, idParam(), deleteMessage);      // DELETE /api/messages/:id    — delete

module.exports = router;
