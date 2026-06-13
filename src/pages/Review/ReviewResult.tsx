import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain, AlertTriangle, Target, TrendingUp, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout';
import { Card, Button, Badge, Tabs, TabsContent } from '@/components/ui';
import { api } from '@/api/client';
import { useReviewStore, useVersionStore } from '@/store';
import { getSeverityColor, getScoreColor, getRecommendationColor } from '@/utils/helpers';
import { ISSUE_TYPE_LABELS, ISSUE_SEVERITY_LABELS, RECOMMENDATION_LABELS } from '../../../shared/types';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import type { ModuleScore, TestFocus, Issue } from '../../../shared/types';

export function ReviewResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentVersion } = useVersionStore();
  const {
    review, setReview,
    moduleScores, setModuleScores,
    testFocuses, setTestFocuses,
    issues, setIssues,
  } = useReviewStore();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    if (id) {
      loadReviewData(id);
    }
  }, [id]);
  
  async function loadReviewData(versionId: string) {
    try {
      setLoading(true);
      const report = await api.reports.get(versionId);
      setReview(report.review);
      setModuleScores(report.moduleScores);
      setTestFocuses(report.testFocuses);
      setIssues(report.issues);
    } catch (error) {
      console.error('Failed to load review data:', error);
    } finally {
      setLoading(false);
    }
  }
  
  const radarData = moduleScores.map((m) => ({
    name: m.moduleName,
    score: m.score,
    fullMark: 100,
  }));
  
  const tabs = [
    { id: 'overview', label: '评审概览', icon: <Brain className="w-4 h-4" /> },
    { id: 'scores', label: '模块评分', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'issues', label: '问题发现', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'focuses', label: '测试关注点', icon: <Target className="w-4 h-4" /> },
  ];
  
  return (
    <div>
      <Header
        title="AI 评审"
        subtitle={currentVersion ? `版本 ${currentVersion.versionNumber}` : ''}
        showBack
        actions={
          <Button onClick={() => navigate(`/versions/${id}/issues`)}>
            <ChevronRight className="w-4 h-4 mr-2" />
            查看问题跟踪
          </Button>
        }
      />
      
      <div className="p-6">
        {loading ? (
          <div className="animate-pulse space-y-6">
            <Card className="h-32 bg-gray-100" />
            <Card className="h-64 bg-gray-100" />
          </div>
        ) : !review ? (
          <Card className="text-center py-12">
            <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">暂无评审结果</h3>
            <p className="text-sm text-gray-500 mb-4">请先在需求清单页面发起 AI 评审</p>
            <Button onClick={() => navigate(`/versions/${id}/requirements`)}>
              前往需求清单
            </Button>
          </Card>
        ) : (
          <>
            <Card className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={getRecommendationColor(review.recommendation)}>
                      {RECOMMENDATION_LABELS[review.recommendation]}
                    </Badge>
                    <span className={`text-3xl font-bold ${getScoreColor(review.overallScore)}`}>
                      {review.overallScore} 分
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{review.summary}</p>
                </div>
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar
                        name="评分"
                        dataKey="score"
                        stroke="#1E3A5F"
                        fill="#1E3A5F"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
            
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            
            <TabsContent>
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {moduleScores.map((score) => (
                    <Card key={score.id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{score.moduleName}</span>
                        <span className={`text-lg font-bold ${getScoreColor(score.score)}`}>
                          {score.score}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            score.score >= 90 ? 'bg-green-500' :
                            score.score >= 70 ? 'bg-blue-500' :
                            score.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score.score}%` }}
                        />
                      </div>
                      <div className="mt-3 space-y-1">
                        {score.details.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-xs text-gray-500">
                            <span>{d.criterion}</span>
                            <span>{d.score}分</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              {activeTab === 'scores' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {moduleScores.map((score) => (
                    <Card key={score.id}>
                      <CardHeader>
                        <CardTitle>{score.moduleName}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-2xl font-bold ${getScoreColor(score.score)}`}>
                            {score.score}
                          </span>
                          <span className="text-sm text-gray-500">/ {score.maxScore}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {score.details.map((d, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">{d.criterion}</span>
                                <Badge variant="default" size="sm">权重 {d.weight}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="h-1.5 rounded-full bg-[#1E3A5F]"
                                    style={{ width: `${d.score}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-700">{d.score}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {activeTab === 'issues' && (
                <div className="space-y-4">
                  {issues.length === 0 ? (
                    <Card className="text-center py-8">
                      <AlertTriangle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                      <p className="text-gray-600">本次评审未发现问题</p>
                    </Card>
                  ) : (
                    issues.map((issue) => (
                      <Card key={issue.id} className="group hover:border-gray-300 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                            {ISSUE_SEVERITY_LABELS[issue.severity]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="default" size="sm">
                                {ISSUE_TYPE_LABELS[issue.type]}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-gray-900">{issue.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-700">
                                <span className="font-medium">建议：</span>{issue.suggestion}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
              
              {activeTab === 'focuses' && (
                <div className="space-y-4">
                  {testFocuses.length === 0 ? (
                    <Card className="text-center py-8">
                      <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">暂无测试关注点</p>
                    </Card>
                  ) : (
                    testFocuses.map((focus, index) => (
                      <Card key={focus.id}>
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            focus.priority === 1 ? 'bg-red-100 text-red-600' :
                            focus.priority === 2 ? 'bg-orange-100 text-orange-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {focus.priority}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="info" size="sm">{focus.category}</Badge>
                            </div>
                            <p className="text-sm text-gray-900">{focus.description}</p>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </div>
    </div>
  );
}