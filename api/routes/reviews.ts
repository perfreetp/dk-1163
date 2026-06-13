import { Router } from 'express';
import db from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import type { Review, ModuleScore, TestFocus, Issue } from '../../shared/types';

const router = Router();

router.post('/versions/:versionId/reviews', (req, res) => {
  const { versionId } = req.params;
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.prepare('UPDATE versions SET status = ? WHERE id = ?').run('reviewing', versionId);
  
  db.prepare(`
    INSERT INTO reviews (id, version_id, overall_score, recommendation, summary, created_at)
    VALUES (?, ?, 0, 'conditional', '', ?)
  `).run(id, versionId, now);
  
  const modules = ['需求完整性', '交互设计', '文案规范', '数据埋点', '发布风险'];
  const moduleWeights = [25, 20, 15, 20, 20];
  
  modules.forEach((moduleName, index) => {
    const scoreId = uuidv4();
    const score = Math.floor(Math.random() * 30) + 70;
    const details = [
      { criterion: '完整性', score: Math.floor(Math.random() * 20) + 80, weight: 0.4 },
      { criterion: '规范性', score: Math.floor(Math.random() * 20) + 70, weight: 0.3 },
      { criterion: '一致性', score: Math.floor(Math.random() * 20) + 75, weight: 0.3 },
    ];
    
    db.prepare(`
      INSERT INTO module_scores (id, review_id, module_name, score, max_score, details)
      VALUES (?, ?, ?, ?, 100, ?)
    `).run(scoreId, id, moduleName, score, JSON.stringify(details));
  });
  
  const issueTypes = ['requirement_missing', 'interaction_conflict', 'text_inconsistency', 'exception_flow', 'data_mismatch', 'release_risk'];
  const severities = ['critical', 'high', 'medium', 'low'];
  const issueTemplates = [
    { type: 'requirement_missing', title: '需求遗漏：用户注销流程未定义', description: '在需求文档中未找到用户注销账号的完整流程说明', suggestion: '补充用户注销流程的需求定义，包括注销入口、确认流程、数据处理等' },
    { type: 'interaction_conflict', title: '交互冲突：登录状态与购物车同步', description: '用户登录后购物车数据未与本地缓存同步，可能导致数据丢失', suggestion: '优化登录后的购物车同步逻辑，确保本地与服务器数据一致' },
    { type: 'text_inconsistency', title: '文案不一致：错误提示语风格差异', description: '不同页面的错误提示语风格不统一，部分使用正式语气，部分使用口语化表达', suggestion: '统一错误提示语风格，建议使用简洁正式的表达方式' },
    { type: 'exception_flow', title: '异常流程：网络断开时订单提交', description: '网络断开时订单提交无明确提示和恢复机制', suggestion: '增加网络异常检测和订单本地暂存机制，网络恢复后自动重试' },
    { type: 'data_mismatch', title: '数据口径：订单金额计算差异', description: '埋点事件中的订单金额与实际支付金额存在计算差异', suggestion: '统一订单金额的计算口径，确保埋点数据与业务数据一致' },
    { type: 'release_risk', title: '发布风险：第三方服务依赖', description: '支付服务依赖第三方API，未配置备用方案', suggestion: '配置支付服务的备用通道，确保主服务异常时可切换' },
  ];
  
  const numIssues = Math.floor(Math.random() * 5) + 3;
  for (let i = 0; i < numIssues; i++) {
    const template = issueTemplates[i % issueTemplates.length];
    const issueId = uuidv4();
    const severity = severities[Math.floor(Math.random() * severities.length)];
    
    db.prepare(`
      INSERT INTO issues (id, review_id, type, severity, title, description, suggestion, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
    `).run(issueId, id, template.type, severity, template.title, template.description, template.suggestion, now, now);
  }
  
  const testFocuses = [
    { description: '验证用户注销流程的完整性和数据清理', priority: 1, category: '功能测试' },
    { description: '测试登录状态切换时的购物车数据同步', priority: 2, category: '交互测试' },
    { description: '检查各页面错误提示语的统一性', priority: 3, category: '文案测试' },
    { description: '模拟网络异常场景下的订单提交', priority: 1, category: '异常测试' },
    { description: '验证订单金额埋点数据准确性', priority: 2, category: '数据测试' },
    { description: '测试支付服务异常时的降级处理', priority: 1, category: '风险测试' },
  ];
  
  testFocuses.forEach((focus, index) => {
    const focusId = uuidv4();
    db.prepare(`
      INSERT INTO test_focuses (id, review_id, description, priority, category, related_issues)
      VALUES (?, ?, ?, ?, ?, '[]')
    `).run(focusId, id, focus.description, focus.priority, focus.category);
  });
  
  const moduleScores = db.prepare('SELECT * FROM module_scores WHERE review_id = ?').all(id) as ModuleScore[];
  const overallScore = Math.round(moduleScores.reduce((sum, m) => sum + m.score, 0) / moduleScores.length);
  
  const issues = db.prepare('SELECT * FROM issues WHERE review_id = ?').all(id) as Issue[];
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const highCount = issues.filter(i => i.severity === 'high').length;
  
  let recommendation = 'recommend';
  if (criticalCount > 0) recommendation = 'not_recommend';
  else if (highCount > 2) recommendation = 'conditional';
  
  const summary = `本次评审共发现 ${issues.length} 个问题，其中严重问题 ${criticalCount} 个，高优先级问题 ${highCount} 个。综合评分 ${overallScore} 分。`;
  
  db.prepare('UPDATE reviews SET overall_score = ?, recommendation = ?, summary = ? WHERE id = ?').run(overallScore, recommendation, summary, id);
  db.prepare('UPDATE versions SET status = ? WHERE id = ?').run('approved', versionId);
  
  res.json({ reviewId: id, status: 'completed' });
});

router.get('/:reviewId', (req, res) => {
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.reviewId) as Review | undefined;
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }
  res.json(review);
});

router.get('/:reviewId/module-scores', (req, res) => {
  const scores = db.prepare('SELECT * FROM module_scores WHERE review_id = ?').all(req.params.reviewId) as ModuleScore[];
  const parsedScores = scores.map(s => ({
    ...s,
    details: JSON.parse(s.details || '[]'),
  }));
  res.json(parsedScores);
});

router.get('/:reviewId/test-focuses', (req, res) => {
  const focuses = db.prepare('SELECT * FROM test_focuses WHERE review_id = ? ORDER BY priority ASC').all(req.params.reviewId) as TestFocus[];
  const parsedFocuses = focuses.map(f => ({
    ...f,
    relatedIssues: JSON.parse(f.relatedIssues || '[]'),
  }));
  res.json(parsedFocuses);
});

export default router;