import type { Version, Requirement, Screenshot, TrackingPoint, AcceptanceCriteria, Review, ModuleScore, TestFocus, Issue } from '../../shared/types';

export function mapVersion(row: any): Version {
  if (!row) return null as any;
  return {
    id: row.id,
    versionNumber: row.version_number,
    description: row.description || '',
    releaseDate: row.release_date || '',
    status: row.status || 'draft',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRequirement(row: any): Requirement {
  if (!row) return null as any;
  return {
    id: row.id,
    versionId: row.version_id,
    title: row.title,
    content: row.content || '',
    category: row.category || '',
    priority: row.priority || 0,
    createdAt: row.created_at,
  };
}

export function mapScreenshot(row: any): Screenshot {
  if (!row) return null as any;
  return {
    id: row.id,
    versionId: row.version_id,
    url: row.url,
    description: row.description || '',
    category: row.category || '',
    createdAt: row.created_at,
  };
}

export function mapTrackingPoint(row: any): TrackingPoint {
  if (!row) return null as any;
  return {
    id: row.id,
    versionId: row.version_id,
    eventName: row.event_name,
    triggerCondition: row.trigger_condition || '',
    dataFields: typeof row.data_fields === 'string' ? JSON.parse(row.data_fields || '{}') : (row.dataFields || {}),
    expectedValue: row.expected_value || '',
    createdAt: row.created_at,
  };
}

export function mapAcceptanceCriteria(row: any): AcceptanceCriteria {
  if (!row) return null as any;
  return {
    id: row.id,
    versionId: row.version_id,
    description: row.description,
    isRequired: Boolean(row.is_required),
    status: row.status || 'pending',
    createdAt: row.created_at,
  };
}

export function mapReview(row: any): Review {
  if (!row) return null as any;
  return {
    id: row.id,
    versionId: row.version_id,
    createdAt: row.created_at,
    overallScore: row.overall_score || 0,
    recommendation: row.recommendation || 'conditional',
    summary: row.summary || '',
  };
}

export function mapModuleScore(row: any): ModuleScore {
  if (!row) return null as any;
  return {
    id: row.id,
    reviewId: row.review_id,
    moduleName: row.module_name,
    score: row.score || 0,
    maxScore: row.max_score || 100,
    details: typeof row.details === 'string' ? JSON.parse(row.details || '[]') : (row.details || []),
  };
}

export function mapTestFocus(row: any): TestFocus {
  if (!row) return null as any;
  return {
    id: row.id,
    reviewId: row.review_id,
    description: row.description,
    priority: row.priority || 0,
    category: row.category || '',
    relatedIssues: typeof row.related_issues === 'string' ? JSON.parse(row.related_issues || '[]') : (row.relatedIssues || []),
  };
}

export function mapIssue(row: any): Issue {
  if (!row) return null as any;
  return {
    id: row.id,
    reviewId: row.review_id,
    type: row.type,
    severity: row.severity,
    title: row.title,
    description: row.description || '',
    suggestion: row.suggestion || '',
    status: row.status || 'open',
    assignee: row.assignee || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}