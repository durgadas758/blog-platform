const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, (req, res) => {
  const { post_id, content } = req.body;

  if (!post_id || !content) {
    return res.status(400).json({ error: 'post_id and content are required.' });
  }
  if (content.trim().length < 1) {
    return res.status(400).json({ error: 'Comment cannot be empty.' });
  }
  if (content.length > 2000) {
    return res.status(400).json({ error: 'Comment cannot exceed 2000 characters.' });
  }

  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(post_id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });

  try {
    const result = db.prepare(
      'INSERT INTO comments (content, post_id, author_id) VALUES (?, ?, ?)'
    ).run(content.trim(), post_id, req.user.id);

    const comment = db.prepare(`
      SELECT c.id, c.content, c.created_at, c.post_id,
             u.id as author_id, u.username as author_username, u.avatar_color as author_avatar_color
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

router.delete('/:id', requireAuth, (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
  if (!comment) return res.status(404).json({ error: 'Comment not found.' });
  if (comment.author_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete your own comments.' });
  }

  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
  res.json({ message: 'Comment deleted successfully.' });
});

module.exports = router;
