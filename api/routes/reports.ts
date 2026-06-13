import { Router } from 'express';
import db from '../db/database';
import { mapVersion, mapReview, mapModuleScore, mapIssue, mapTestFocus } from '../db/mappers';

const router = Router();

router.get('/versions/:versionId/report', (req, res) => {
  const versionRow = db.prepare('SELECT * FROM versions WHERE id = ?').get(req.params.versionId);
  if (!versionRow) {
    return res.status(404).json({ error: 'Version not found' });
  }
  const version = mapVersion(versionRow);
  
  const reviewRow = db.prepare('SELECT * FROM reviews WHERE version_id = ?').get(req.params.versionId);
  if (!reviewRow) {
    return res.status(404).json({ error: 'Review not found for this version' });
  }
  const review = mapReview(reviewRow);
  
  const moduleScoreRows = db.prepare('SELECT * FROM module_scores WHERE review_id = ?').all(review.id);
  const moduleScores = moduleScoreRows.map(mapModuleScore);
  
  const issueRows = db.prepare('SELECT * FROM issues WHERE review_id = ?').all(review.id);
  const issues = issueRows.map(mapIssue);
  
  const testFocusRows = db.prepare('SELECT * FROM test_focuses WHERE review_id = ?').all(review.id);
  const testFocuses = testFocusRows.map(mapTestFocus);
  
  const riskSummary = {
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
  };
  
  const previousVersionRows = db.prepare('SELECT * FROM versions WHERE created_at < ? ORDER BY created_at DESC LIMIT 1').all(version.createdAt);
  
  let comparison = undefined;
  if (previousVersionRows.length > 0) {
    const previousVersion = mapVersion(previousVersionRows[0]);
    const previousReviewRow = db.prepare('SELECT * FROM reviews WHERE version_id = ?').get(previousVersion.id);
    if (previousReviewRow) {
      const previousReview = mapReview(previousReviewRow);
      const previousIssueRows = db.prepare('SELECT * FROM issues WHERE review_id = ?').all(previousReview.id);
      comparison = {
        previousVersion: previousVersion,
        scoreChange: review.overallScore - previousReview.overallScore,
        issueCountChange: issues.length - previousIssueRows.length,
      };
    }
  }
  
  res.json({
    version,
    review,
    moduleScores,
    issues,
    testFocuses,
    riskSummary,
    comparison,
  });
});

export default router;