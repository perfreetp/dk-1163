import { Router } from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import type { Issue, Todo, AdoptionRecord } from '../../shared/types';

const router = Router();

router.get('/:reviewId/issues', (req, res) => {
  const { reviewId } = req.params;
  const { status, severity, type } = req.query;
  
  let query = 'SELECT * FROM issues WHERE review_id = ?';
  const params: string[] = [reviewId];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status as string);
  }
  if (severity) {
    query += ' AND severity = ?';
    params.push(severity as string);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type as string);
  }
  
  query += ' ORDER BY severity ASC, created_at DESC';
  
  const issues = db.prepare(query).all(...params) as Issue[];
  res.json(issues);
});

router.put('/:id/status', (req, res) => {
  const { status, assignee } = req.body;
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE issues 
    SET status = ?, assignee = COALESCE(?, assignee), updated_at = ?
    WHERE id = ?
  `).run(status, assignee, now, req.params.id);
  
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id) as Issue;
  res.json(issue);
});

router.post('/:id/todos', (req, res) => {
  const { title, assignee, dueDate } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO todos (id, issue_id, title, status, assignee, due_date, created_at)
    VALUES (?, ?, ?, 'pending', ?, ?, ?)
  `).run(id, req.params.id, title, assignee || '', dueDate || '', now);
  
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as Todo;
  res.json(todo);
});

router.get('/:id/todos', (req, res) => {
  const todos = db.prepare('SELECT * FROM todos WHERE issue_id = ?').all(req.params.id) as Todo[];
  res.json(todos);
});

router.post('/:id/adoption', (req, res) => {
  const { isAdopted, feedback } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO adoption_records (id, issue_id, is_adopted, feedback, recorded_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.params.id, isAdopted ? 1 : 0, feedback || '', now);
  
  const record = db.prepare('SELECT * FROM adoption_records WHERE id = ?').get(id) as AdoptionRecord;
  res.json({ ...record, isAdopted: Boolean(record.isAdopted) });
});

router.get('/:id/adoption', (req, res) => {
  const records = db.prepare('SELECT * FROM adoption_records WHERE issue_id = ?').all(req.params.id) as AdoptionRecord[];
  const parsedRecords = records.map(r => ({ ...r, isAdopted: Boolean(r.isAdopted) }));
  res.json(parsedRecords);
});

export default router;