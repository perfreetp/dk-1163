import { Router } from 'express';
import db from '../db/database';
import type { Version, Review, ModuleScore, Issue, TestFocus, ReviewReport } from '../../shared/types';

const router = Router();

router.get('/versions/:versionId/report', (req, res) => {
  const version = db.prepare('SELECT * FROM versions WHERE id = ?').get(req.params.versionId) as Version | undefined;
  if (!version) {
    return res.status(404).json({ error: 'Version not found' });
  }
  
  const review = db.prepare('SELECT * FROM reviews WHERE version_id = ?').get(req.params.versionId) as Review | undefined;
  if (!review) {
    return res.status(404).json({ error: 'Review not found for this version' });
  }
  
  const moduleScores = db.prepare('SELECT * FROM module_scores WHERE review_id = ?').all(review.id) as ModuleScore[];
  const parsedScores = moduleScores.map(s => ({
    ...s,
    details: JSON.parse(s.details || '[]'),
  }));
  
  const issues = db.prepare('SELECT * FROM issues WHERE review_id = ?').all(review.id) as Issue[];
  
  const testFocuses = db.prepare('SELECT * FROM test_focuses WHERE review_id = ?').all(review.id) as TestFocus[];
  const parsedFocuses = testFocuses.map(f => ({
    ...f,
    relatedIssues: JSON.parse(f.relatedIssues || '[]'),
  }));
  
  const riskSummary = {
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
  };
  
  const previousVersions = db.prepare('SELECT * FROM versions WHERE created_at < ? ORDER BY created_at DESC LIMIT 1').all(version.createdAt) as Version[];
  
  let comparison = undefined;
  if (previousVersions.length > 0) {
    const previousReview = db.prepare('SELECT * FROM reviews WHERE version_id = ?').get(previousVersions[0].id) as Review | undefined;
    if (previousReview) {
      const previousIssues = db.prepare('SELECT * FROM issues WHERE review_id = ?').all(previousReview.id) as Issue[];
      comparison = {
        previousVersion: previousVersions[0],
        scoreChange: review.overallScore - previousReview.overallScore,
        issueCountChange: issues.length - previousIssues.length,
      };
    }
  }
  
  const report: ReviewReport = {
    version,
    review,
    moduleScores: parsedScores,
    issues,
    testFocuses: parsedFocuses,
    riskSummary,
    comparison,
  };
  
  res.json(report);
});

export default router;