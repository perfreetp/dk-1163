import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'review.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS versions (
    id TEXT PRIMARY KEY,
    version_number TEXT NOT NULL UNIQUE,
    description TEXT,
    release_date TEXT,
    status TEXT DEFAULT 'draft',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS requirements (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    priority INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS screenshots (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    category TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tracking_points (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    trigger_condition TEXT,
    data_fields TEXT,
    expected_value TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS acceptance_criteria (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL,
    description TEXT NOT NULL,
    is_required INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL,
    overall_score REAL,
    recommendation TEXT,
    summary TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    suggestion TEXT,
    status TEXT DEFAULT 'open',
    assignee TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS module_scores (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    module_name TEXT NOT NULL,
    score REAL NOT NULL,
    max_score REAL DEFAULT 100,
    details TEXT,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS test_focuses (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    description TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    category TEXT,
    related_issues TEXT,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    issue_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    assignee TEXT,
    due_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS adoption_records (
    id TEXT PRIMARY KEY,
    issue_id TEXT NOT NULL,
    is_adopted INTEGER NOT NULL,
    feedback TEXT,
    recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
  );
`);

export default db;