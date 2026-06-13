import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, User, Calendar, MessageSquare, ChevronRight, Filter } from 'lucide-react';
import { Header } from '@/components/layout';
import { Card, Button, Badge, Modal } from '@/components/ui';
import { api } from '@/api/client';
import { useReviewStore, useVersionStore } from '@/store';
import { getSeverityColor, getStatusColor, formatDateTime } from '@/utils/helpers';
import { ISSUE_TYPE_LABELS, ISSUE_SEVERITY_LABELS, ISSUE_STATUS_LABELS } from '../../../shared/types';
import type { Issue } from '../../../shared/types';

export function IssueList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentVersion } = useVersionStore();
  const { review, issues, setIssues, updateIssue } = useReviewStore();
  
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [filters, setFilters] = useState({ status: '', severity: '', type: '' });
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [adoptionModalOpen, setAdoptionModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  
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
  
  async function handleUpdateStatus() {
    if (!selectedIssue) return;
    try {
      const updated = await api.issues.updateStatus(selectedIssue.id, {
        status: formData.status,
        assignee: formData.assignee,
      });
      updateIssue(updated);
      setStatusModalOpen(false);
      setSelectedIssue(null);
      setFormData({});
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }
  
  async function handleCreateTodo() {
    if (!selectedIssue) return;
    try {
      await api.issues.createTodo(selectedIssue.id, {
        title: formData.title,
        assignee: formData.assignee,
        dueDate: formData.dueDate,
      });
      setTodoModalOpen(false);
      setSelectedIssue(null);
      setFormData({});
    } catch (error) {
      console.error('Failed to create todo:', error);
    }
  }
  
  async function handleRecordAdoption() {
    if (!selectedIssue) return;
    try {
      await api.issues.recordAdoption(selectedIssue.id, {
        isAdopted: formData.isAdopted,
        feedback: formData.feedback,
      });
      setAdoptionModalOpen(false);
      setSelectedIssue(null);
      setFormData({});
    } catch (error) {
      console.error('Failed to record adoption:', error);
    }
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
                  onClick={() => setSelectedIssue(issue)}
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
                          setSelectedIssue(issue);
                          setFormData({ status: issue.status, assignee: issue.assignee });
                          setStatusModalOpen(true);
                        }}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-[#1E3A5F] transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIssue(issue);
                          setFormData({ title: issue.title });
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
        onClose={() => setSelectedIssue(null)}
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
            
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({ status: selectedIssue.status, assignee: selectedIssue.assignee });
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
        onClose={() => setStatusModalOpen(false)}
        title="更新问题状态"
        footer={
          <>
            <Button variant="ghost" onClick={() => setStatusModalOpen(false)}>取消</Button>
            <Button onClick={handleUpdateStatus}>更新</Button>
          </>
        }
      >
        <div className="space-y-4">
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
        onClose={() => setTodoModalOpen(false)}
        title="关联待办事项"
        footer={
          <>
            <Button variant="ghost" onClick={() => setTodoModalOpen(false)}>取消</Button>
            <Button onClick={handleCreateTodo}>创建</Button>
          </>
        }
      >
        <div className="space-y-4">
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
        onClose={() => setAdoptionModalOpen(false)}
        title="记录采纳情况"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdoptionModalOpen(false)}>取消</Button>
            <Button onClick={handleRecordAdoption}>记录</Button>
          </>
        }
      >
        <div className="space-y-4">
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