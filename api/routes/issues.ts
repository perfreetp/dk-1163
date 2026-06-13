import { Router } from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { mapIssue } from '../db/mappers';

interface DbRow {
  id: string;
  issue_id: string;
  title: string;
  status: string;
  assignee: string | null;
  due_date: string | null;
  created_at: string;
  is_adopted: number;
  feedback: string | null;
  recorded_at: string;
}

const router = Router();

router.get('/:reviewId/issues', (req, res) => {
  const { reviewId } = req.params;
  const { status, severity, type } = req.query;
  
  let query = 'SELECT * FROM issues WHERE review_id = ?';
  const params: any[] = [reviewId];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (severity) {
    query += ' AND severity = ?';
    params.push(severity);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY CASE severity WHEN "critical" THEN 1 WHEN "high" THEN 2 WHEN "medium" THEN 3 ELSE 4 END, created_at DESC';
  
  const rows = db.prepare(query).all(...params);
  const issues = rows.map(mapIssue);
  res.json(issues);
});

router.put('/:id/status', (req, res) => {
  const { status, assignee } = req.body;
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE issues 
    SET status = ?, assignee = COALESCE(?, assignee), updated_at = ?
    WHERE id = ?
  `).run(status, assignee || null, now, req.params.id);
  
  const row = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Issue not found' });
  }
  res.json(mapIssue(row));
});

router.post('/:id/todos', (req, res) => {
  const { title, assignee, dueDate } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO todos (id, issue_id, title, status, assignee, due_date, created_at)
    VALUES (?, ?, ?, 'pending', ?, ?, ?)
  `).run(id, req.params.id, title, assignee || '', dueDate || '', now);
  
  const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as DbRow | undefined;
  res.json({
    id: row?.id,
    issueId: row?.issue_id,
    title: row?.title,
    status: row?.status,
    assignee: row?.assignee || undefined,
    dueDate: row?.due_date || undefined,
    createdAt: row?.created_at,
  });
});

router.get('/:id/todos', (req, res) => {
  const rows = db.prepare('SELECT * FROM todos WHERE issue_id = ?').all(req.params.id) as DbRow[];
  const todos = rows.map((row) => ({
    id: row.id,
    issueId: row.issue_id,
    title: row.title,
    status: row.status,
    assignee: row.assignee || undefined,
    dueDate: row.due_date || undefined,
    createdAt: row.created_at,
  }));
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
  
  const row = db.prepare('SELECT * FROM adoption_records WHERE id = ?').get(id) as DbRow | undefined;
  res.json({
    id: row?.id,
    issueId: row?.issue_id,
    isAdopted: Boolean(row?.is_adopted),
    feedback: row?.feedback || undefined,
    recordedAt: row?.recorded_at,
  });
});

router.get('/:id/adoption', (req, res) => {
  const rows = db.prepare('SELECT * FROM adoption_records WHERE issue_id = ?').all(req.params.id) as DbRow[];
  const records = rows.map((row) => ({
    id: row.id,
    issueId: row.issue_id,
    isAdopted: Boolean(row.is_adopted),
    feedback: row.feedback || undefined,
    recordedAt: row.recorded_at,
  }));
  res.json(records);
});

export default router;