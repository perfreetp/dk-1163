import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, GitCompare, FileText, Brain, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Button, Badge } from '@/components/ui';
import { api } from '@/api/client';
import { formatDate, getScoreColor } from '@/utils/helpers';
import { RECOMMENDATION_LABELS } from '../../../shared/types';

interface CompareData {
  baseVersion: any;
  targetVersion: any;
  changes: {
    requirements: {
      added: number;
      baseCount: number;
      targetCount: number;
    };
  };
  reviewComparison: {
    base: any;
    target: any;
  };
  issueComparison: {
    baseCount: number;
    targetCount: number;
  };
}

export function VersionCompare() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [compareData, setCompareData] = useState<CompareData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const baseId = searchParams.get('baseId');
    const targetId = searchParams.get('targetId');
    
    if (baseId && targetId) {
      loadCompareData(baseId, targetId);
    } else {
      setError('缺少版本参数');
      setLoading(false);
    }
  }, [searchParams]);
  
  async function loadCompareData(baseId: string, targetId: string) {
    try {
      setLoading(true);
      const data = await api.versions.compare(baseId, targetId);
      setCompareData(data);
    } catch (err) {
      console.error('Failed to load compare data:', err);
      setError('加载对比数据失败');
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <div>
        <Header
          title="版本对比"
          subtitle="对比两个版本的差异"
          showBack
        />
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <Card className="h-48 bg-gray-100" />
            <Card className="h-64 bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !compareData) {
    return (
      <div>
        <Header
          title="版本对比"
          subtitle="对比两个版本的差异"
          showBack
        />
        <div className="p-6">
          <Card className="text-center py-12">
            <GitCompare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">加载失败</h3>
            <p className="text-sm text-gray-500 mb-4">{error || '无法加载对比数据'}</p>
            <Button onClick={() => navigate('/versions')}>
              返回版本列表
            </Button>
          </Card>
        </div>
      </div>
    );
  }
  
  const { baseVersion, targetVersion, changes, reviewComparison, issueComparison } = compareData;
  
  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };
  
  const getTrendColor = (value: number, inverse: boolean = false) => {
    if (inverse) {
      if (value > 0) return 'text-red-600';
      if (value < 0) return 'text-green-600';
    } else {
      if (value > 0) return 'text-green-600';
      if (value < 0) return 'text-red-600';
    }
    return 'text-gray-600';
  };
  
  const scoreChange = reviewComparison.target?.overallScore - (reviewComparison.base?.overallScore || 0);
  const issueCountChange = issueComparison.targetCount - issueComparison.baseCount;
  
  return (
    <div>
      <Header
        title="版本对比"
        subtitle={`${baseVersion.versionNumber} vs ${targetVersion.versionNumber}`}
        showBack
      />
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
            <div className="text-center py-4">
              <Badge variant="info" className="mb-2">基准版本</Badge>
              <h3 className="text-xl font-bold text-gray-900">{baseVersion.versionNumber}</h3>
              <p className="text-sm text-gray-500 mt-1">{formatDate(baseVersion.createdAt)}</p>
              {baseVersion.releaseDate && (
                <p className="text-xs text-gray-400 mt-1">
                  计划发布: {formatDate(baseVersion.releaseDate)}
                </p>
              )}
            </div>
          </Card>
          
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#00B4D8]" />
            <div className="text-center py-4">
              <Badge variant="info" className="mb-2">对比版本</Badge>
              <h3 className="text-xl font-bold text-gray-900">{targetVersion.versionNumber}</h3>
              <p className="text-sm text-gray-500 mt-1">{formatDate(targetVersion.createdAt)}</p>
              {targetVersion.releaseDate && (
                <p className="text-xs text-gray-400 mt-1">
                  计划发布: {formatDate(targetVersion.releaseDate)}
                </p>
              )}
            </div>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">需求数量</span>
              </div>
              {getTrendIcon(changes.requirements.added)}
            </div>
            <div className="flex items-end justify-between mt-2">
              <div>
                <span className="text-2xl font-bold text-gray-900">{changes.requirements.targetCount}</span>
                <span className="text-sm text-gray-500"> / {changes.requirements.baseCount}</span>
              </div>
              <span className={`text-sm font-medium ${getTrendColor(changes.requirements.added)}`}>
                {changes.requirements.added > 0 ? '+' : ''}{changes.requirements.added}
              </span>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">综合评分</span>
              </div>
              {getTrendIcon(scoreChange)}
            </div>
            <div className="flex items-end justify-between mt-2">
              <div>
                <span className={`text-2xl font-bold ${getScoreColor(reviewComparison.target?.overallScore || 0)}`}>
                  {reviewComparison.target?.overallScore || '-'}
                </span>
                <span className="text-sm text-gray-500"> / {reviewComparison.base?.overallScore || '-'}</span>
              </div>
              <span className={`text-sm font-medium ${getTrendColor(scoreChange)}`}>
                {scoreChange > 0 ? '+' : ''}{scoreChange}
              </span>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">问题数量</span>
              </div>
              {getTrendIcon(issueCountChange)}
            </div>
            <div className="flex items-end justify-between mt-2">
              <div>
                <span className="text-2xl font-bold text-gray-900">{issueComparison.targetCount}</span>
                <span className="text-sm text-gray-500"> / {issueComparison.baseCount}</span>
              </div>
              <span className={`text-sm font-medium ${getTrendColor(issueCountChange, true)}`}>
                {issueCountChange > 0 ? '+' : ''}{issueCountChange}
              </span>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">发布建议</span>
              </div>
            </div>
            <div className="mt-2">
              <Badge variant={reviewComparison.target?.recommendation === 'recommend' ? 'success' : reviewComparison.target?.recommendation === 'conditional' ? 'warning' : 'error'}>
                {RECOMMENDATION_LABELS[reviewComparison.target?.recommendation || 'conditional']}
              </Badge>
            </div>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>评审详情对比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">基准版本评审</h4>
                {reviewComparison.base ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">评分</span>
                      <span className={`font-medium ${getScoreColor(reviewComparison.base.overallScore)}`}>
                        {reviewComparison.base.overallScore} 分
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">建议</span>
                      <Badge variant={reviewComparison.base.recommendation === 'recommend' ? 'success' : reviewComparison.base.recommendation === 'conditional' ? 'warning' : 'error'} size="sm">
                        {RECOMMENDATION_LABELS[reviewComparison.base.recommendation]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{reviewComparison.base.summary}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">暂无评审数据</p>
                )}
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">对比版本评审</h4>
                {reviewComparison.target ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">评分</span>
                      <span className={`font-medium ${getScoreColor(reviewComparison.target.overallScore)}`}>
                        {reviewComparison.target.overallScore} 分
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">建议</span>
                      <Badge variant={reviewComparison.target.recommendation === 'recommend' ? 'success' : reviewComparison.target.recommendation === 'conditional' ? 'warning' : 'error'} size="sm">
                        {RECOMMENDATION_LABELS[reviewComparison.target.recommendation]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{reviewComparison.target.summary}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">暂无评审数据</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate(`/versions/${baseVersion.id}/report`)}>
            查看基准版本报告
          </Button>
          <Button onClick={() => navigate(`/versions/${targetVersion.id}/report`)}>
            查看对比版本报告
          </Button>
        </div>
      </div>
    </div>
  );
}