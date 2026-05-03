const Post = require('../models/Post');
const User = require('../models/User');

// @desc  Create a post
// @route POST /api/posts
const createPost = async (req, res) => {
  try {
    const { content, type } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content is required' });

    // Get user's community to scope the post
    const user = await User.findById(req.user._id).select('community');

    const post = await Post.create({
      author: req.user._id,
      community: user?.community || null,
      content: content.trim(),
      type: type || 'General',
    });

    const populated = await Post.findById(post._id).populate('author', 'name email role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Get all posts (feed) — newest first + increment views for each post seen
// @route GET /api/posts
const getPosts = async (req, res) => {
  try {
    // Scope feed to user's community — only posts from same community are shown
    const currentUser = await User.findById(req.user._id).select('community');
    const communityFilter = currentUser?.community
      ? { community: currentUser.community }
      : { community: null };

    const posts = await Post.find(communityFilter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('author', 'name email role')
      .populate('comments.author', 'name email');

    const postIds = posts
      .filter(p => p.author?._id?.toString() !== req.user._id.toString())
      .map(p => p._id);

    if (postIds.length > 0) {
      await Post.updateMany({ _id: { $in: postIds } }, { $inc: { views: 1 } });
      const updatedPosts = await Post.find({ _id: { $in: posts.map(p => p._id) } })
        .sort({ createdAt: -1 })
        .populate('author', 'name email role')
        .populate('comments.author', 'name email');
      return res.json(updatedPosts);
    }

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Get single post + increment view count
// @route GET /api/posts/:id
const getPost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },   // increment view on read
      { new: true }
    )
      .populate('author', 'name email role')
      .populate('comments.author', 'name email');

    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  React to a post (toggle emoji)
// @route PUT /api/posts/:id/react
const reactToPost = async (req, res) => {
  try {
    const { emoji } = req.body; // e.g. '👍'
    if (!emoji) return res.status(400).json({ message: 'emoji is required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.user._id.toString();
    const existing = post.reactions.get(userId);

    if (existing === emoji) {
      // Toggle off — remove reaction
      post.reactions.delete(userId);
    } else {
      // Set or change reaction
      post.reactions.set(userId, emoji);
    }

    await post.save();

    // Return reaction summary: { '👍': 3, '🔥': 1 }
    const summary = {};
    for (const [, e] of post.reactions) {
      summary[e] = (summary[e] || 0) + 1;
    }

    res.json({ reactions: summary, myReaction: post.reactions.get(userId) || null });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Add a comment to a post
// @route POST /api/posts/:id/comment
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ author: req.user._id, text: text.trim() });
    await post.save();

    // Populate only the new comment's author
    const updated = await Post.findById(post._id)
      .populate('author', 'name email role')
      .populate('comments.author', 'name email');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Delete a post (only author can delete)
// @route DELETE /api/posts/:id
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { createPost, getPosts, getPost, reactToPost, addComment, deletePost };
