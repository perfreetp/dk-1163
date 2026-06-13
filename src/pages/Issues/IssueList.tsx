import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, User, Calendar, MessageSquare, ChevronRight, Filter, ListTodo, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal } from '@/components/ui';
import { api } from '@/api/client';
import { useReviewStore, useVersionStore } from '@/store';
import { getSeverityColor, getStatusColor, formatDateTime } from '@/utils/helpers';
import { ISSUE_TYPE_LABELS, ISSUE_SEVERITY_LABELS, ISSUE_STATUS_LABELS } from '../../../shared/types';
import type { Issue } from '../../../shared/types';

interface TodoItem {
  id: string;
  issueId: string;
  title: string;
  status: string;
  assignee?: string;
  dueDate?: string;
  createdAt: string;
}

interface AdoptionItem {
  id: string;
  issueId: string;
  isAdopted: boolean;
  feedback?: string;
  recordedAt: string;
}

export function IssueList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentVersion } = useVersionStore();
  const { review, issues, setIssues, updateIssue } = useReviewStore();
  
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [issueTodos, setIssueTodos] = useState<TodoItem[]>([]);
  const [issueAdoptions, setIssueAdoptions] = useState<AdoptionItem[]>([]);
  const [filters, setFilters] = useState({ status: '', severity: '', type: '' });
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [adoptionModalOpen, setAdoptionModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [operationError, setOperationError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);
  
  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);
  
  async function loadData(versionId: string) {
    try {
      setLoading(true);
      const report = await api.reports.get(versionId);
      setIssues(report.issues);
    } catch (error) {
      console.error('Failed to load issues:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function loadIssueDetails(issueId: string) {
    try {
      const todos = await api.issues.getTodos(issueId);
      setIssueTodos(todos);
      const adoptions = await api.issues.getAdoptions(issueId);
      setIssueAdoptions(adoptions);
    } catch (error) {
      console.error('Failed to load issue details:', error);
      setIssueTodos([]);
      setIssueAdoptions([]);
    }
  }
  
  async function handleUpdateStatus() {
    if (!selectedIssue) return;
    setOperationError(null);
    setOperationLoading(true);
    try {
      const updated = await api.issues.updateStatus(selectedIssue.id, {
        status: formData.status,
        assignee: formData.assignee,
      });
      updateIssue(updated);
      setStatusModalOpen(false);
      setSelectedIssue(updated);
      setFormData({});
    } catch (error: any) {
      setOperationError(error.message || '更新状态失败，请稍后重试');
    } finally {
      setOperationLoading(false);
    }
  }
  
  async function handleCreateTodo() {
    if (!selectedIssue) return;
    if (!formData.title) {
      setOperationError('请输入待办标题');
      return;
    }
    setOperationError(null);
    setOperationLoading(true);
    try {
      await api.issues.createTodo(selectedIssue.id, {
        title: formData.title,
        assignee: formData.assignee,
        dueDate: formData.dueDate,
      });
      await loadIssueDetails(selectedIssue.id);
      setTodoModalOpen(false);
      setFormData({});
    } catch (error: any) {
      setOperationError(error.message || '创建待办失败，请稍后重试');
    } finally {
      setOperationLoading(false);
    }
  }
  
  async function handleRecordAdoption() {
    if (!selectedIssue) return;
    setOperationError(null);
    setOperationLoading(true);
    try {
      await api.issues.recordAdoption(selectedIssue.id, {
        isAdopted: formData.isAdopted,
        feedback: formData.feedback,
      });
      await loadIssueDetails(selectedIssue.id);
      setAdoptionModalOpen(false);
      setFormData({});
    } catch (error: any) {
      setOperationError(error.message || '记录采纳失败，请稍后重试');
    } finally {
      setOperationLoading(false);
    }
  }
  
  function handleSelectIssue(issue: Issue) {
    setSelectedIssue(issue);
    loadIssueDetails(issue.id);
  }
  
  const filteredIssues = issues.filter((issue) => {
    if (filters.status && issue.status !== filters.status) return false;
    if (filters.severity && issue.severity !== filters.severity) return false;
    if (filters.type && issue.type !== filters.type) return false;
    return true;
  });
  
  const statusOptions = ['open', 'in_progress', 'resolved', 'verified', 'closed'];
  const severityOptions = ['critical', 'high', 'medium', 'low'];
  const typeOptions = ['requirement_missing', 'interaction_conflict', 'text_inconsistency', 'exception_flow', 'data_mismatch', 'release_risk'];
  
  return (
    <div>
      <Header
        title="问题跟踪"
        subtitle={currentVersion ? `版本 ${currentVersion.versionNumber}` : ''}
        showBack
        actions={
          <Button onClick={() => navigate(`/versions/${id}/report`)}>
            <ChevronRight className="w-4 h-4 mr-2" />
            查看发布建议
          </Button>
        }
      />
      
      <div className="p-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-24 bg-gray-100" />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <Card className="text-center py-12">
            <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">暂无问题</h3>
            <p className="text-sm text-gray-500">本次评审未发现问题</p>
          </Card>
        ) : (
          <>
            <Card className="mb-6">
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                >
                  <option value="">全部状态</option>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{ISSUE_STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                >
                  <option value="">全部严重程度</option>
                  {severityOptions.map((s) => (
                    <option key={s} value={s}>{ISSUE_SEVERITY_LABELS[s]}</option>
                  ))}
                </select>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                >
                  <option value="">全部类型</option>
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>{ISSUE_TYPE_LABELS[t]}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-500 ml-auto">
                  共 {filteredIssues.length} 个问题
                </span>
              </div>
            </Card>
            
            <div className="space-y-4">
              {filteredIssues.map((issue) => (
                <Card
                  key={issue.id}
                  hoverable
                  onClick={() => handleSelectIssue(issue)}
                  className="group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                      {ISSUE_SEVERITY_LABELS[issue.severity]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="default" size="sm">
                          {ISSUE_TYPE_LABELS[issue.type]}
                        </Badge>
                        <Badge className={getStatusColor(issue.status)} size="sm">
                          {ISSUE_STATUS_LABELS[issue.status]}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-gray-900">{issue.title}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{issue.description}</p>
                      {issue.assignee && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <User className="w-3.5 h-3.5" />
                          <span>负责人: {issue.assignee}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectIssue(issue);
                          setFormData({ status: issue.status, assignee: issue.assignee });
                          setOperationError(null);
                          setStatusModalOpen(true);
                        }}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-[#1E3A5F] transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectIssue(issue);
                          setFormData({ title: issue.title });
                          setOperationError(null);
                          setTodoModalOpen(true);
                        }}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-[#1E3A5F] transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
      
      <Modal
        open={selectedIssue !== null && !statusModalOpen && !todoModalOpen && !adoptionModalOpen}
        onClose={() => {
          setSelectedIssue(null);
          setIssueTodos([]);
          setIssueAdoptions([]);
        }}
        title={selectedIssue?.title || ''}
        size="lg"
      >
        {selectedIssue && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={getSeverityColor(selectedIssue.severity)}>
                {ISSUE_SEVERITY_LABELS[selectedIssue.severity]}
              </Badge>
              <Badge className={getStatusColor(selectedIssue.status)}>
                {ISSUE_STATUS_LABELS[selectedIssue.status]}
              </Badge>
              <Badge variant="default">
                {ISSUE_TYPE_LABELS[selectedIssue.type]}
              </Badge>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">问题描述</h4>
              <p className="text-sm text-gray-600">{selectedIssue.description}</p>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700 mb-1">建议方案</h4>
              <p className="text-sm text-blue-600">{selectedIssue.suggestion}</p>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>创建时间: {formatDateTime(selectedIssue.createdAt)}</span>
              <span>更新时间: {formatDateTime(selectedIssue.updatedAt)}</span>
            </div>
            
            {selectedIssue.assignee && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>负责人: {selectedIssue.assignee}</span>
              </div>
            )}
            
            {issueTodos.length > 0 && (
              <Card padding="sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-gray-500" />
                    <CardTitle className="text-sm">关联待办 ({issueTodos.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {issueTodos.map((todo) => (
                      <div key={todo.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="text-sm text-gray-900">{todo.title}</span>
                          {todo.assignee && (
                            <span className="text-xs text-gray-500 ml-2">- {todo.assignee}</span>
                          )}
                        </div>
                        <Badge variant={todo.status === 'completed' ? 'success' : 'default'} size="sm">
                          {todo.status === 'pending' ? '待处理' : todo.status === 'in_progress' ? '进行中' : '已完成'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {issueAdoptions.length > 0 && (
              <Card padding="sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <CardTitle className="text-sm">采纳记录 ({issueAdoptions.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {issueAdoptions.map((adoption) => (
                      <div key={adoption.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                        {adoption.isAdopted ? (
                          <ThumbsUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <ThumbsDown className="w-4 h-4 text-red-500" />
                        )}
                        <div className="flex-1">
                          <span className="text-sm text-gray-900">
                            {adoption.isAdopted ? '已采纳' : '未采纳'}
                          </span>
                          {adoption.feedback && (
                            <p className="text-xs text-gray-500 mt-1">{adoption.feedback}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDateTime(adoption.recordedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({ status: selectedIssue.status, assignee: selectedIssue.assignee });
                  setOperationError(null);
                  setStatusModalOpen(true);
                }}
              >
                <Check className="w-4 h-4 mr-2" />
                更新状态
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({ title: selectedIssue.title });
                  setOperationError(null);
                  setTodoModalOpen(true);
                }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                关联待办
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({ isAdopted: true });
                  setOperationError(null);
                  setAdoptionModalOpen(true);
                }}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                记录采纳
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      <Modal
        open={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setOperationError(null);
        }}
        title="更新问题状态"
        footer={
          <>
            <Button variant="ghost" onClick={() => {
              setStatusModalOpen(false);
              setOperationError(null);
            }}>取消</Button>
            <Button onClick={handleUpdateStatus} loading={operationLoading}>更新</Button>
          </>
        }
      >
        <div className="space-y-4">
          {operationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{operationError}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={formData.status || ''}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{ISSUE_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
            <input
              type="text"
              value={formData.assignee || ''}
              onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
              placeholder="输入负责人姓名"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
          </div>
        </div>
      </Modal>
      
      <Modal
        open={todoModalOpen}
        onClose={() => {
          setTodoModalOpen(false);
          setOperationError(null);
        }}
        title="关联待办事项"
        footer={
          <>
            <Button variant="ghost" onClick={() => {
              setTodoModalOpen(false);
              setOperationError(null);
            }}>取消</Button>
            <Button onClick={handleCreateTodo} loading={operationLoading}>创建</Button>
          </>
        }
      >
        <div className="space-y-4">
          {operationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{operationError}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">待办标题</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
            <input
              type="text"
              value={formData.assignee || ''}
              onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
              placeholder="输入负责人姓名"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
            <input
              type="date"
              value={formData.dueDate || ''}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
          </div>
        </div>
      </Modal>
      
      <Modal
        open={adoptionModalOpen}
        onClose={() => {
          setAdoptionModalOpen(false);
          setOperationError(null);
        }}
        title="记录采纳情况"
        footer={
          <>
            <Button variant="ghost" onClick={() => {
              setAdoptionModalOpen(false);
              setOperationError(null);
            }}>取消</Button>
            <Button onClick={handleRecordAdoption} loading={operationLoading}>记录</Button>
          </>
        }
      >
        <div className="space-y-4">
          {operationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{operationError}</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={formData.isAdopted === true}
                onChange={() => setFormData({ ...formData, isAdopted: true })}
                className="w-4 h-4 text-[#1E3A5F]"
              />
              <span className="text-sm text-gray-700">采纳建议</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={formData.isAdopted === false}
                onChange={() => setFormData({ ...formData, isAdopted: false })}
                className="w-4 h-4 text-[#1E3A5F]"
              />
              <span className="text-sm text-gray-700">不采纳</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={formData.feedback || ''}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              placeholder="输入备注说明..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}