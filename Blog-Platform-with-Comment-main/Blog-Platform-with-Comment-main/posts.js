const express = require('express');
const db = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const COVER_COLORS = [
  'linear-gradient(135deg, #1e1b4b, #4c1d95)',
  'linear-gradient(135deg, #0c1445, #1e3a8a)',
  'linear-gradient(135deg, #064e3b, #065f46)',
  'linear-gradient(135deg, #3b0764, #6b21a8)',
  'linear-gradient(135deg, #1a1a2e, #16213e)',
  'linear-gradient(135deg, #450a0a, #7f1d1d)',
  'linear-gradient(135deg, #0c4a6e, #075985)',
  'linear-gradient(135deg, #14532d, #166534)',
];

function randomCoverColor() {
  return COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)];
}

function generateExcerpt(content, length = 160) {
  const plain = content.replace(/\n/g, ' ').trim();
  return plain.length > length ? plain.slice(0, length).trimEnd() + '…' : plain;
}

router.get('/', optionalAuth, (req, res) => {
  const { search, author } = req.query;
  let query = `
    SELECT 
      p.id, p.title, p.excerpt, p.cover_color, p.created_at, p.updated_at,
      u.id as author_id, u.username as author_username, u.avatar_color as author_avatar_color,
      COUNT(c.id) as comment_count
    FROM posts p
    JOIN users u ON p.author_id = u.id
    LEFT JOIN comments c ON c.post_id = p.id
  `;
  const params = [];

  if (search) {
    query += ` WHERE (p.title LIKE ? OR p.content LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  if (author) {
    query += (search ? ' AND' : ' WHERE') + ` u.username = ?`;
    params.push(author);
  }

  query += ` GROUP BY p.id ORDER BY p.created_at DESC`;

  try {
    const posts = db.prepare(query).all(...params);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts.' });
  }
});

router.get('/:id', optionalAuth, (req, res) => {
  const post = db.prepare(`
    SELECT 
      p.id, p.title, p.content, p.excerpt, p.cover_color, p.created_at, p.updated_at,
      u.id as author_id, u.username as author_username, u.avatar_color as author_avatar_color, u.bio as author_bio
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!post) return res.status(404).json({ error: 'Post not found.' });

  const comments = db.prepare(`
    SELECT 
      c.id, c.content, c.created_at,
      u.id as author_id, u.username as author_username, u.avatar_color as author_avatar_color
    FROM comments c
    JOIN users u ON c.author_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.id);

  res.json({ ...post, comments });
});

router.post('/', requireAuth, (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }
  if (title.length < 5) {
    return res.status(400).json({ error: 'Title must be at least 5 characters.' });
  }
  if (content.length < 20) {
    return res.status(400).json({ error: 'Content must be at least 20 characters.' });
  }

  const excerpt = generateExcerpt(content);
  const cover_color = randomCoverColor();

  try {
    const result = db.prepare(
      'INSERT INTO posts (title, content, excerpt, cover_color, author_id) VALUES (?, ?, ?, ?, ?)'
    ).run(title.trim(), content.trim(), excerpt, cover_color, req.user.id);

    const post = db.prepare(`
      SELECT p.*, u.username as author_username, u.avatar_color as author_avatar_color
      FROM posts p JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post.' });
  }
});

router.put('/:id', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  if (post.author_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only edit your own posts.' });
  }

  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  const excerpt = generateExcerpt(content);

  db.prepare(
    'UPDATE posts SET title = ?, content = ?, excerpt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(title.trim(), content.trim(), excerpt, req.params.id);

  const updated = db.prepare(`
    SELECT p.*, u.username as author_username, u.avatar_color as author_avatar_color
    FROM posts p JOIN users u ON p.author_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);

  res.json(updated);
});

router.delete('/:id', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  if (post.author_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete your own posts.' });
  }

  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Post deleted successfully.' });
});

module.exports = router;
