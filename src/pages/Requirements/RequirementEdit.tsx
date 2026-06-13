import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Check, X, Image, Target, ListChecks, FileText, Brain } from 'lucide-react';
import { Header } from '@/components/layout';
import { Card, Button, Badge, Modal, Tabs, TabsContent } from '@/components/ui';
import { api } from '@/api/client';
import { useRequirementStore, useVersionStore } from '@/store';
import { formatDate } from '@/utils/helpers';
import type { Requirement, Screenshot, TrackingPoint, AcceptanceCriteria } from '../../../shared/types';

export function RequirementEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentVersion, setCurrentVersion } = useVersionStore();
  const {
    requirements, setRequirements, addRequirement, deleteRequirement,
    screenshots, setScreenshots, addScreenshot, deleteScreenshot,
    trackingPoints, setTrackingPoints, addTrackingPoint, deleteTrackingPoint,
    acceptanceCriteria, setAcceptanceCriteria, addAcceptanceCriteria, updateAcceptanceCriteria, deleteAcceptanceCriteria,
  } = useRequirementStore();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requirements');
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  
  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);
  
  async function loadData(versionId: string) {
    try {
      setLoading(true);
      const version = await api.versions.get(versionId);
      setCurrentVersion(version);
      
      const reqs = await api.requirements.list(versionId);
      setRequirements(reqs);
      
      const shots = await api.screenshots.list(versionId);
      setScreenshots(shots);
      
      const points = await api.trackingPoints.list(versionId);
      setTrackingPoints(points);
      
      const criteria = await api.acceptanceCriteria.list(versionId);
      setAcceptanceCriteria(criteria);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleAddRequirement() {
    if (!id || !formData.title) return;
    const req = await api.requirements.create(id, {
      title: formData.title,
      content: formData.content,
      category: formData.category || '功能',
      priority: formData.priority || 0,
    });
    addRequirement(req);
    setModalOpen(null);
    setFormData({});
  }
  
  async function handleAddScreenshot() {
    if (!id || !formData.url) return;
    const shot = await api.screenshots.create(id, {
      url: formData.url,
      description: formData.description,
      category: formData.category || '功能截图',
    });
    addScreenshot(shot);
    setModalOpen(null);
    setFormData({});
  }
  
  async function handleAddTrackingPoint() {
    if (!id || !formData.eventName) return;
    const point = await api.trackingPoints.create(id, {
      eventName: formData.eventName,
      triggerCondition: formData.triggerCondition,
      dataFields: formData.dataFields || {},
      expectedValue: formData.expectedValue,
    });
    addTrackingPoint(point);
    setModalOpen(null);
    setFormData({});
  }
  
  async function handleAddAcceptanceCriteria() {
    if (!id || !formData.description) return;
    const criteria = await api.acceptanceCriteria.create(id, {
      description: formData.description,
      isRequired: formData.isRequired ?? true,
    });
    addAcceptanceCriteria(criteria);
    setModalOpen(null);
    setFormData({});
  }
  
  async function handleUpdateCriteriaStatus(criteriaId: string, status: 'pending' | 'passed' | 'failed') {
    if (!id) return;
    const updated = await api.acceptanceCriteria.updateStatus(id, criteriaId, status);
    updateAcceptanceCriteria(updated);
  }
  
  async function handleDeleteRequirement(reqId: string) {
    if (!id) return;
    await api.requirements.delete(id, reqId);
    deleteRequirement(reqId);
  }
  
  async function handleDeleteScreenshot(shotId: string) {
    if (!id) return;
    await api.screenshots.delete(id, shotId);
    deleteScreenshot(shotId);
  }
  
  async function handleDeleteTrackingPoint(pointId: string) {
    if (!id) return;
    await api.trackingPoints.delete(id, pointId);
    deleteTrackingPoint(pointId);
  }
  
  async function handleDeleteAcceptanceCriteria(criteriaId: string) {
    if (!id) return;
    await api.acceptanceCriteria.delete(id, criteriaId);
    deleteAcceptanceCriteria(criteriaId);
  }
  
  async function handleStartReview() {
    if (!id) return;
    try {
      const result = await api.reviews.create(id);
      navigate(`/versions/${id}/review`);
    } catch (error) {
      console.error('Failed to start review:', error);
    }
  }
  
  const tabs = [
    { id: 'requirements', label: '改动录入', icon: <FileText className="w-4 h-4" /> },
    { id: 'screenshots', label: '截图管理', icon: <Image className="w-4 h-4" /> },
    { id: 'tracking', label: '埋点定义', icon: <Target className="w-4 h-4" /> },
    { id: 'criteria', label: '验收标准', icon: <ListChecks className="w-4 h-4" /> },
  ];
  
  return (
    <div>
      <Header
        title="需求清单"
        subtitle={currentVersion ? `版本 ${currentVersion.versionNumber}` : ''}
        showBack
        actions={
          <Button onClick={handleStartReview}>
            <Brain className="w-4 h-4 mr-2" />
            发起 AI 评审
          </Button>
        }
      />
      
      <div className="p-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        
        <TabsContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-16 bg-gray-100" />
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'requirements' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={() => setModalOpen('requirement')}>
                      <Plus className="w-4 h-4 mr-2" />
                      添加需求
                    </Button>
                  </div>
                  
                  {requirements.length === 0 ? (
                    <Card className="text-center py-8">
                      <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">暂无需求，添加本次版本的改动内容</p>
                    </Card>
                  ) : (
                    requirements.map((req) => (
                      <Card key={req.id} className="group">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="info">{req.category}</Badge>
                              {req.priority > 0 && (
                                <Badge variant="warning">优先级 {req.priority}</Badge>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900">{req.title}</h4>
                            {req.content && (
                              <p className="text-sm text-gray-600 mt-1">{req.content}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteRequirement(req.id)}
                            className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
              
              {activeTab === 'screenshots' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={() => setModalOpen('screenshot')}>
                      <Plus className="w-4 h-4 mr-2" />
                      上传截图
                    </Button>
                  </div>
                  
                  {screenshots.length === 0 ? (
                    <Card className="text-center py-8">
                      <Image className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">暂无截图，上传功能截图和交互流程图</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {screenshots.map((shot) => (
                        <Card key={shot.id} padding="none" className="group overflow-hidden">
                          <div className="aspect-video bg-gray-100 relative">
                            <img
                              src={shot.url}
                              alt={shot.description}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=placeholder%20screenshot&image_size=square';
                              }}
                            />
                            <button
                              onClick={() => handleDeleteScreenshot(shot.id)}
                              className="absolute top-2 right-2 p-1 rounded bg-white/80 hover:bg-red-100 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="p-3">
                            <Badge variant="default" size="sm">{shot.category}</Badge>
                            <p className="text-sm text-gray-600 mt-1 truncate">{shot.description}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'tracking' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={() => setModalOpen('tracking')}>
                      <Plus className="w-4 h-4 mr-2" />
                      添加埋点
                    </Button>
                  </div>
                  
                  {trackingPoints.length === 0 ? (
                    <Card className="text-center py-8">
                      <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">暂无埋点，定义数据采集事件</p>
                    </Card>
                  ) : (
                    <Card padding="none">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">事件名称</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">触发条件</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">数据字段</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">期望值</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {trackingPoints.map((point) => (
                            <tr key={point.id} className="group">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{point.eventName}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{point.triggerCondition}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {Object.keys(point.dataFields).length > 0
                                  ? Object.keys(point.dataFields).join(', ')
                                  : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{point.expectedValue || '-'}</td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleDeleteTrackingPoint(point.id)}
                                  className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  )}
                </div>
              )}
              
              {activeTab === 'criteria' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={() => setModalOpen('criteria')}>
                      <Plus className="w-4 h-4 mr-2" />
                      添加验收标准
                    </Button>
                  </div>
                  
                  {acceptanceCriteria.length === 0 ? (
                    <Card className="text-center py-8">
                      <ListChecks className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">暂无验收标准，设置功能验收条件</p>
                    </Card>
                  ) : (
                    acceptanceCriteria.map((criteria) => (
                      <Card key={criteria.id} className="group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {criteria.isRequired && (
                              <Badge variant="error" size="sm">必选</Badge>
                            )}
                            <span className="text-sm text-gray-900">{criteria.description}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleUpdateCriteriaStatus(criteria.id, 'passed')}
                                className={`p-1.5 rounded transition-colors ${
                                  criteria.status === 'passed'
                                    ? 'bg-green-100 text-green-600'
                                    : 'hover:bg-green-100 text-gray-400 hover:text-green-600'
                                }`}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateCriteriaStatus(criteria.id, 'failed')}
                                className={`p-1.5 rounded transition-colors ${
                                  criteria.status === 'failed'
                                    ? 'bg-red-100 text-red-600'
                                    : 'hover:bg-red-100 text-gray-400 hover:text-red-600'
                                }`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleDeleteAcceptanceCriteria(criteria.id)}
                              className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </div>
      
      <Modal
        open={modalOpen === 'requirement'}
        onClose={() => setModalOpen(null)}
        title="添加需求"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(null)}>取消</Button>
            <Button onClick={handleAddRequirement}>添加</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">需求标题</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">需求内容</label>
            <textarea
              value={formData.content || ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <select
              value={formData.category || '功能'}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            >
              <option value="功能">功能</option>
              <option value="交互">交互</option>
              <option value="性能">性能</option>
              <option value="安全">安全</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>
      </Modal>
      
      <Modal
        open={modalOpen === 'screenshot'}
        onClose={() => setModalOpen(null)}
        title="上传截图"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(null)}>取消</Button>
            <Button onClick={handleAddScreenshot}>上传</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">截图 URL</label>
            <input
              type="text"
              value={formData.url || ''}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="输入图片 URL 或使用占位图"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <select
              value={formData.category || '功能截图'}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            >
              <option value="功能截图">功能截图</option>
              <option value="交互流程">交互流程</option>
              <option value="界面设计">界面设计</option>
              <option value="异常状态">异常状态</option>
            </select>
          </div>
        </div>
      </Modal>
      
      <Modal
        open={modalOpen === 'tracking'}
        onClose={() => setModalOpen(null)}
        title="添加埋点"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(null)}>取消</Button>
            <Button onClick={handleAddTrackingPoint}>添加</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">事件名称</label>
            <input
              type="text"
              value={formData.eventName || ''}
              onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
              placeholder="例如: click_submit_button"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">触发条件</label>
            <input
              type="text"
              value={formData.triggerCondition || ''}
              onChange={(e) => setFormData({ ...formData, triggerCondition: e.target.value })}
              placeholder="例如: 用户点击提交按钮"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">期望值</label>
            <input
              type="text"
              value={formData.expectedValue || ''}
              onChange={(e) => setFormData({ ...formData, expectedValue: e.target.value })}
              placeholder="例如: 每日 1000 次"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
          </div>
        </div>
      </Modal>
      
      <Modal
        open={modalOpen === 'criteria'}
        onClose={() => setModalOpen(null)}
        title="添加验收标准"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(null)}>取消</Button>
            <Button onClick={handleAddAcceptanceCriteria}>添加</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">验收标准描述</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="例如: 用户登录成功后跳转到首页"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isRequired ?? true}
              onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-[#1E3A5F] focus:ring-[#1E3A5F]"
            />
            <label className="text-sm text-gray-700">必选验收项</label>
          </div>
        </div>
      </Modal>
    </div>
  );
}