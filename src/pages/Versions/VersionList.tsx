import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, FileText, Brain, AlertTriangle, Trash2, GitCompare } from 'lucide-react';
import { Header } from '@/components/layout';
import { Card, Button, Badge, Modal, Progress } from '@/components/ui';
import { api } from '@/api/client';
import { useVersionStore } from '@/store';
import { formatDate, getStatusColor } from '@/utils/helpers';
import type { Version } from '../../../shared/types';
import { VERSION_STATUS_LABELS } from '../../../shared/types';

export function VersionList() {
  const navigate = useNavigate();
  const { versions, setVersions, addVersion, deleteVersion } = useVersionStore();
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [formData, setFormData] = useState({ versionNumber: '', description: '', releaseDate: '' });
  const [selectedVersions, setSelectedVersions] = useState<{ base: string; target: string }>({ base: '', target: '' });
  
  useEffect(() => {
    loadVersions();
  }, []);
  
  async function loadVersions() {
    try {
      setLoading(true);
      const result = await api.versions.list();
      setVersions(result.versions);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleCreate() {
    if (!formData.versionNumber) return;
    try {
      const version = await api.versions.create(formData);
      addVersion(version);
      setCreateModalOpen(false);
      setFormData({ versionNumber: '', description: '', releaseDate: '' });
    } catch (error) {
      console.error('Failed to create version:', error);
    }
  }
  
  async function handleDelete(id: string) {
    try {
      await api.versions.delete(id);
      deleteVersion(id);
    } catch (error) {
      console.error('Failed to delete version:', error);
    }
  }
  
  function handleSelectVersion(version: Version) {
    useVersionStore.getState().setCurrentVersion(version);
    navigate(`/versions/${version.id}/requirements`);
  }
  
  async function handleCompare() {
    if (!selectedVersions.base || !selectedVersions.target) return;
    navigate(`/versions/compare?baseId=${selectedVersions.base}&targetId=${selectedVersions.target}`);
  }
  
  return (
    <div>
      <Header
        title="版本空间"
        subtitle="管理所有版本，创建新版本或对比历史版本"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCompareModalOpen(true)}>
              <GitCompare className="w-4 h-4 mr-2" />
              版本对比
            </Button>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              创建版本
            </Button>
          </div>
        }
      />
      
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : versions.length === 0 ? (
          <Card className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">暂无版本</h3>
            <p className="text-sm text-gray-500 mb-4">创建第一个版本开始评审流程</p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              创建版本
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {versions.map((version) => (
              <Card
                key={version.id}
                hoverable
                onClick={() => handleSelectVersion(version)}
                className="group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(version.status)}>
                      {VERSION_STATUS_LABELS[version.status]}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatDate(version.createdAt)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(version.id);
                    }}
                    className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {version.versionNumber}
                </h3>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {version.description || '暂无描述'}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{version.releaseDate ? formatDate(version.releaseDate) : '未设定'}</span>
                  </div>
                </div>
                
                <Progress value={version.status === 'released' ? 100 : version.status === 'approved' ? 80 : version.status === 'reviewing' ? 50 : 20} showLabel />
                
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      useVersionStore.getState().setCurrentVersion(version);
                      navigate(`/versions/${version.id}/requirements`);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-[#1E3A5F] hover:bg-gray-100 rounded transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    需求
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      useVersionStore.getState().setCurrentVersion(version);
                      navigate(`/versions/${version.id}/review`);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-[#1E3A5F] hover:bg-gray-100 rounded transition-colors"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    评审
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      useVersionStore.getState().setCurrentVersion(version);
                      navigate(`/versions/${version.id}/issues`);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-[#1E3A5F] hover:bg-gray-100 rounded transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    问题
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="创建新版本"
        description="填写版本基本信息，开始评审流程"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate}>
              创建
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">版本号</label>
            <input
              type="text"
              value={formData.versionNumber}
              onChange={(e) => setFormData({ ...formData, versionNumber: e.target.value })}
              placeholder="例如: v2.1.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">版本描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述本次版本的主要改动内容..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">计划发布日期</label>
            <input
              type="date"
              value={formData.releaseDate}
              onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
            />
          </div>
        </div>
      </Modal>
      
      <Modal
        open={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        title="版本对比"
        description="选择两个版本进行差异对比"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCompareModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCompare} disabled={!selectedVersions.base || !selectedVersions.target}>
              开始对比
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">基准版本</label>
            <select
              value={selectedVersions.base}
              onChange={(e) => setSelectedVersions({ ...selectedVersions, base: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
            >
              <option value="">选择基准版本</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>{v.versionNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">对比版本</label>
            <select
              value={selectedVersions.target}
              onChange={(e) => setSelectedVersions({ ...selectedVersions, target: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
            >
              <option value="">选择对比版本</option>
              {versions.filter((v) => v.id !== selectedVersions.base).map((v) => (
                <option key={v.id} value={v.id}>{v.versionNumber}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}