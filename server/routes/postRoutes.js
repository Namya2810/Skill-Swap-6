const express = require('express');
const router = express.Router();
const { createPost, getPosts, getPost, reactToPost, addComment, deletePost } = require('../controllers/postController');
const { commentRules, createPostRules, idParam, reactRules } = require('../middleware/validators');
const { protect } = require('../middleware/authMiddleware');

router.get('/',                protect, getPosts);      // GET  /api/posts
router.post('/',               protect, createPostRules, createPost);    // POST /api/posts
router.get('/:id',             protect, idParam(), getPost);       // GET  /api/posts/:id
router.put('/:id/react',       protect, reactRules, reactToPost);   // PUT  /api/posts/:id/react
router.post('/:id/comment',    protect, commentRules, addComment);    // POST /api/posts/:id/comment
router.delete('/:id',          protect, idParam(), deletePost);    // DELETE /api/posts/:id

module.exports = router;
