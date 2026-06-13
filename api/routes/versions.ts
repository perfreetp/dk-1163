import { Router } from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { mapVersion, mapReview } from '../db/mappers';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM versions ORDER BY created_at DESC').all();
  const versions = rows.map(mapVersion);
  res.json({ versions, total: versions.length });
});

router.get('/compare', (req, res) => {
  const { baseId, targetId } = req.query;
  
  if (!baseId || !targetId) {
    return res.status(400).json({ error: 'baseId and targetId are required' });
  }
  
  const baseVersion = db.prepare('SELECT * FROM versions WHERE id = ?').get(baseId);
  const targetVersion = db.prepare('SELECT * FROM versions WHERE id = ?').get(targetId);
  
  if (!baseVersion || !targetVersion) {
    return res.status(404).json({ error: 'Version not found' });
  }
  
  const baseRequirements = db.prepare('SELECT * FROM requirements WHERE version_id = ?').all(baseId);
  const targetRequirements = db.prepare('SELECT * FROM requirements WHERE version_id = ?').all(targetId);
  
  const baseReview = db.prepare('SELECT * FROM reviews WHERE version_id = ?').get(baseId);
  const targetReview = db.prepare('SELECT * FROM reviews WHERE version_id = ?').get(targetId);
  
  const baseIssues = db.prepare('SELECT * FROM issues WHERE review_id = ?').all(baseReview ? (baseReview as any).id : null);
  const targetIssues = db.prepare('SELECT * FROM issues WHERE review_id = ?').all(targetReview ? (targetReview as any).id : null);
  
  res.json({
    baseVersion: mapVersion(baseVersion),
    targetVersion: mapVersion(targetVersion),
    changes: {
      requirements: {
        added: targetRequirements.length - baseRequirements.length,
        baseCount: baseRequirements.length,
        targetCount: targetRequirements.length,
      },
    },
    reviewComparison: {
      base: baseReview ? mapReview(baseReview) : null,
      target: targetReview ? mapReview(targetReview) : null,
    },
    issueComparison: {
      baseCount: baseIssues.length,
      targetCount: targetIssues.length,
    },
  });
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM versions WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Version not found' });
  }
  res.json(mapVersion(row));
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
    
    const row = db.prepare('SELECT * FROM versions WHERE id = ?').get(id);
    res.json(mapVersion(row));
  } catch (error) {
    console.error('Create version error:', error);
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
    
    const row = db.prepare('SELECT * FROM versions WHERE id = ?').get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'Version not found' });
    }
    res.json(mapVersion(row));
  } catch (error) {
    console.error('Update version error:', error);
    res.status(400).json({ error: 'Failed to update version' });
  }
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM versions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;