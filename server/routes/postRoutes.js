const express = require('express');
const router = express.Router();
const { createPost, getPosts, getPost, reactToPost, addComment, deletePost } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',                protect, getPosts);      // GET  /api/posts
router.post('/',               protect, createPost);    // POST /api/posts
router.get('/:id',             protect, getPost);       // GET  /api/posts/:id
router.put('/:id/react',       protect, reactToPost);   // PUT  /api/posts/:id/react
router.post('/:id/comment',    protect, addComment);    // POST /api/posts/:id/comment
router.delete('/:id',          protect, deletePost);    // DELETE /api/posts/:id

module.exports = router;
