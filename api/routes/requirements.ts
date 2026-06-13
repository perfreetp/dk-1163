import { Router } from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import type { Requirement, Screenshot, TrackingPoint, AcceptanceCriteria } from '../../shared/types';

const router = Router({ mergeParams: true });

router.get('/requirements', (req, res) => {
  const { versionId } = req.params;
  const requirements = db.prepare('SELECT * FROM requirements WHERE version_id = ? ORDER BY priority DESC, created_at DESC').all(versionId) as Requirement[];
  res.json(requirements);
});

router.post('/requirements', (req, res) => {
  const { versionId } = req.params;
  const { title, content, category, priority } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO requirements (id, version_id, title, content, category, priority, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, versionId, title, content || '', category || '功能', priority || 0, now);
  
  const requirement = db.prepare('SELECT * FROM requirements WHERE id = ?').get(id) as Requirement;
  res.json(requirement);
});

router.put('/requirements/:id', (req, res) => {
  const { title, content, category, priority } = req.body;
  
  db.prepare(`
    UPDATE requirements 
    SET title = COALESCE(?, title),
        content = COALESCE(?, content),
        category = COALESCE(?, category),
        priority = COALESCE(?, priority)
    WHERE id = ?
  `).run(title, content, category, priority, req.params.id);
  
  const requirement = db.prepare('SELECT * FROM requirements WHERE id = ?').get(req.params.id) as Requirement;
  res.json(requirement);
});

router.delete('/requirements/:id', (req, res) => {
  db.prepare('DELETE FROM requirements WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/screenshots', (req, res) => {
  const { versionId } = req.params;
  const screenshots = db.prepare('SELECT * FROM screenshots WHERE version_id = ? ORDER BY created_at DESC').all(versionId) as Screenshot[];
  res.json(screenshots);
});

router.post('/screenshots', (req, res) => {
  const { versionId } = req.params;
  const { url, description, category } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO screenshots (id, version_id, url, description, category, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, versionId, url, description || '', category || '功能截图', now);
  
  const screenshot = db.prepare('SELECT * FROM screenshots WHERE id = ?').get(id) as Screenshot;
  res.json(screenshot);
});

router.delete('/screenshots/:id', (req, res) => {
  db.prepare('DELETE FROM screenshots WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/tracking-points', (req, res) => {
  const { versionId } = req.params;
  const points = db.prepare('SELECT * FROM tracking_points WHERE version_id = ? ORDER BY created_at DESC').all(versionId) as TrackingPoint[];
  const parsedPoints = points.map(p => ({
    ...p,
    dataFields: JSON.parse(p.dataFields || '{}'),
  }));
  res.json(parsedPoints);
});

router.post('/tracking-points', (req, res) => {
  const { versionId } = req.params;
  const { eventName, triggerCondition, dataFields, expectedValue } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO tracking_points (id, version_id, event_name, trigger_condition, data_fields, expected_value, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, versionId, eventName, triggerCondition || '', JSON.stringify(dataFields || {}), expectedValue || '', now);
  
  const point = db.prepare('SELECT * FROM tracking_points WHERE id = ?').get(id) as TrackingPoint;
  res.json({ ...point, dataFields: JSON.parse(point.dataFields || '{}') });
});

router.put('/tracking-points/:id', (req, res) => {
  const { eventName, triggerCondition, dataFields, expectedValue } = req.body;
  
  db.prepare(`
    UPDATE tracking_points 
    SET event_name = COALESCE(?, event_name),
        trigger_condition = COALESCE(?, trigger_condition),
        data_fields = COALESCE(?, data_fields),
        expected_value = COALESCE(?, expected_value)
    WHERE id = ?
  `).run(eventName, triggerCondition, JSON.stringify(dataFields), expectedValue, req.params.id);
  
  const point = db.prepare('SELECT * FROM tracking_points WHERE id = ?').get(req.params.id) as TrackingPoint;
  res.json({ ...point, dataFields: JSON.parse(point.dataFields || '{}') });
});

router.delete('/tracking-points/:id', (req, res) => {
  db.prepare('DELETE FROM tracking_points WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/acceptance-criteria', (req, res) => {
  const { versionId } = req.params;
  const criteria = db.prepare('SELECT * FROM acceptance_criteria WHERE version_id = ? ORDER BY created_at DESC').all(versionId) as AcceptanceCriteria[];
  res.json(criteria);
});

router.post('/acceptance-criteria', (req, res) => {
  const { versionId } = req.params;
  const { description, isRequired } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO acceptance_criteria (id, version_id, description, is_required, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `).run(id, versionId, description, isRequired ? 1 : 0, now);
  
  const criteria = db.prepare('SELECT * FROM acceptance_criteria WHERE id = ?').get(id) as AcceptanceCriteria;
  res.json(criteria);
});

router.put('/acceptance-criteria/:id/status', (req, res) => {
  const { status } = req.body;
  
  db.prepare('UPDATE acceptance_criteria SET status = ? WHERE id = ?').run(status, req.params.id);
  
  const criteria = db.prepare('SELECT * FROM acceptance_criteria WHERE id = ?').get(req.params.id) as AcceptanceCriteria;
  res.json(criteria);
});

router.delete('/acceptance-criteria/:id', (req, res) => {
  db.prepare('DELETE FROM acceptance_criteria WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;