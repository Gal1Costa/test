/* eslint-disable */
const { Router } = require('express');
const { requireRole } = require('../../../app/roles.middleware');
const { getPool } = require('../../../shared/db');

const router = Router();

/**
 * GET /api/me
 * Returns the current user (from DB). In dev, if user isn't in DB and header has info, it inserts a record.
 */
router.get('/', requireRole(['visitor','hiker','guide','admin']), async (req, res) => {
  const pool = getPool();
  const headerUser = req.user || { role: 'visitor' };

  // Visitors return lightweight object; no DB lookup.
  if (headerUser.role === 'visitor' || !headerUser.id) {
    return res.status(200).json({ id: null, role: 'visitor' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, avatar, created_at
       FROM users WHERE id = $1`,
      [headerUser.id]
    );

    if (rows.length > 0) {
      return res.status(200).json(rows[0]);
    }

    // Dev convenience: if user doesn't exist in DB, create a basic row using header info
    const name = headerUser.name || 'Dev User';
    const email = headerUser.email || 'dev@local';
    const role = headerUser.role || 'hiker';

    const insert = await pool.query(
      `INSERT INTO users (id, name, email, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, avatar, created_at`,
      [headerUser.id, name, email, role]
    );
    return res.status(200).json(insert.rows[0]);
  } catch (err) {
    console.error('GET /api/me error', err);
    return res.status(500).json({ error: 'Failed to load current user' });
  }
});

/**
 * GET /api/me/hikes?when=upcoming|past|all
 * Returns hikes the current user has joined, optionally filtered by time.
 */
router.get('/hikes', requireRole('hiker'), async (req, res) => {
  const pool = getPool();
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const when = (req.query.when || 'upcoming').toLowerCase();
  try {
    const sql = `
      SELECT
        e.id,
        e.name,
        e.location,
        e.date,
        e.capacity,
        e.difficulty,
        e.description,
        g.id      AS guide_id,
        u.name    AS guide_name,
        COUNT(p2.user_id) AS participants_count
      FROM participants p
      JOIN events e ON e.id = p.event_id
      JOIN guides g ON e.guide_id = g.id
      JOIN users  u ON g.user_id = u.id
      LEFT JOIN participants p2 ON p2.event_id = e.id
      WHERE p.user_id = $1
      GROUP BY e.id, g.id, u.id
      ORDER BY e.date;
    `;
    const { rows } = await pool.query(sql, [userId]);

    const now = new Date();
    const all = rows.map(r => ({
      id: r.id,
      name: r.name,
      location: r.location,
      date: r.date,
      capacity: r.capacity,
      difficulty: r.difficulty,
      description: r.description,
      guide: { id: r.guide_id, name: r.guide_name },
      participantsCount: Number(r.participants_count),
      isFull: Number(r.participants_count) >= r.capacity,
      joined: true,
    }));

    const filtered =
      when === 'all'
        ? all
        : when === 'past'
        ? all.filter(h => new Date(h.date) < now)
        : all.filter(h => new Date(h.date) >= now); // upcoming (default)

    res.status(200).json(filtered);
  } catch (err) {
    console.error('GET /api/me/hikes error', err);
    res.status(500).json({ error: 'Failed to load joined hikes' });
  }
});

module.exports = router;
