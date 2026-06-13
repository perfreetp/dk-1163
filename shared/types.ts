export type VersionStatus = 'draft' | 'reviewing' | 'approved' | 'rejected' | 'released';

export type IssueType = 'requirement_missing' | 'interaction_conflict' | 'text_inconsistency' | 'exception_flow' | 'data_mismatch' | 'release_risk';

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'verified' | 'closed';

export type ReleaseRecommendation = 'recommend' | 'conditional' | 'not_recommend';

export type CriteriaStatus = 'pending' | 'passed' | 'failed';

export interface Version {
  id: string;
  versionNumber: string;
  description: string;
  releaseDate: string;
  status: VersionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Requirement {
  id: string;
  versionId: string;
  title: string;
  content: string;
  category: string;
  priority: number;
  createdAt: string;
}

export interface Screenshot {
  id: string;
  versionId: string;
  url: string;
  description: string;
  category: string;
  createdAt: string;
}

export interface TrackingPoint {
  id: string;
  versionId: string;
  eventName: string;
  triggerCondition: string;
  dataFields: Record<string, string>;
  expectedValue: string;
  createdAt: string;
}

export interface AcceptanceCriteria {
  id: string;
  versionId: string;
  description: string;
  isRequired: boolean;
  status: CriteriaStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  versionId: string;
  createdAt: string;
  overallScore: number;
  recommendation: ReleaseRecommendation;
  summary: string;
}

export interface Issue {
  id: string;
  reviewId: string;
  type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
  suggestion: string;
  status: IssueStatus;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleScore {
  id: string;
  reviewId: string;
  moduleName: string;
  score: number;
  maxScore: number;
  details: {
    criterion: string;
    score: number;
    weight: number;
  }[];
}

export interface TestFocus {
  id: string;
  reviewId: string;
  description: string;
  priority: number;
  category: string;
  relatedIssues: string[];
}

export interface Todo {
  id: string;
  issueId: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignee?: string;
  dueDate?: string;
  createdAt: string;
}

export interface AdoptionRecord {
  id: string;
  issueId: string;
  isAdopted: boolean;
  feedback?: string;
  recordedAt: string;
}

export interface ReviewReport {
  version: Version;
  review: Review;
  moduleScores: ModuleScore[];
  issues: Issue[];
  testFocuses: TestFocus[];
  riskSummary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  comparison?: {
    previousVersion: Version;
    scoreChange: number;
    issueCountChange: number;
  };
}

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  requirement_missing: '需求遗漏',
  interaction_conflict: '交互冲突',
  text_inconsistency: '文案不一致',
  exception_flow: '异常流程',
  data_mismatch: '数据口径',
  release_risk: '发布风险',
};

export const ISSUE_SEVERITY_LABELS: Record<IssueSeverity, string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
};

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: '待处理',
  in_progress: '处理中',
  resolved: '已解决',
  verified: '已验证',
  closed: '已关闭',
};

export const VERSION_STATUS_LABELS: Record<VersionStatus, string> = {
  draft: '草稿',
  reviewing: '评审中',
  approved: '已通过',
  rejected: '已拒绝',
  released: '已发布',
};

export const RECOMMENDATION_LABELS: Record<ReleaseRecommendation, string> = {
  recommend: '建议发布',
  conditional: '有条件发布',
  not_recommend: '不建议发布',
};