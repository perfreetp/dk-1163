import { Router } from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import type { Version } from '../../shared/types';

const router = Router();

router.get('/', (req, res) => {
  const versions = db.prepare('SELECT * FROM versions ORDER BY created_at DESC').all() as Version[];
  res.json({ versions, total: versions.length });
});

router.get('/:id', (req, res) => {
  const version = db.prepare('SELECT * FROM versions WHERE id = ?').get(req.params.id) as Version | undefined;
  if (!version) {
    return res.status(404).json({ error: 'Version not found' });
  }
  res.json(version);
});

router.post('/', (req, res) => {
  const { versionNumber, description, releaseDate } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  
  try {
    db.prepare(`
      INSERT INTO versions (id, version_number, description, release_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'draft', ?, ?)
    `).run(id, versionNumber, description || '', releaseDate || '', now, now);
    
    const version = db.prepare('SELECT * FROM versions WHERE id = ?').get(id) as Version;
    res.json(version);
  } catch (error) {
    res.status(400).json({ error: 'Version number already exists' });
  }
});

router.put('/:id', (req, res) => {
  const { versionNumber, description, releaseDate, status } = req.body;
  const now = new Date().toISOString();
  
  try {
    db.prepare(`
      UPDATE versions 
      SET version_number = COALESCE(?, version_number),
          description = COALESCE(?, description),
          release_date = COALESCE(?, release_date),
          status = COALESCE(?, status),
          updated_at = ?
      WHERE id = ?
    `).run(versionNumber, description, releaseDate, status, now, req.params.id);
    
    const version = db.prepare('SELECT * FROM versions WHERE id = ?').get(req.params.id) as Version;
    res.json(version);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update version' });
  }
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM versions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/compare', (req, res) => {
  const { baseId, targetId } = req.query;
  
  const baseVersion = db.prepare('SELECT * FROM versions WHERE id = ?').get(baseId) as Version | undefined;
  const targetVersion = db.prepare('SELECT * FROM versions WHERE id = ?').get(targetId) as Version | undefined;
  
  if (!baseVersion || !targetVersion) {
    return res.status(404).json({ error: 'Version not found' });
  }
  
  const baseRequirements = db.prepare('SELECT * FROM requirements WHERE version_id = ?').all(baseId);
  const targetRequirements = db.prepare('SELECT * FROM requirements WHERE version_id = ?').all(targetId);
  
  const baseReview = db.prepare('SELECT * FROM reviews WHERE version_id = ?').get(baseId);
  const targetReview = db.prepare('SELECT * FROM reviews WHERE version_id = ?').get(targetId);
  
  res.json({
    baseVersion,
    targetVersion,
    changes: {
      requirements: {
        added: targetRequirements.length - baseRequirements.length,
        baseCount: baseRequirements.length,
        targetCount: targetRequirements.length,
      },
    },
    reviewComparison: {
      base: baseReview,
      target: targetReview,
    },
  });
});

export default router;