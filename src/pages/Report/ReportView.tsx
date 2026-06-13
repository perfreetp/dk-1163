import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileCheck, AlertTriangle, TrendingUp, Download, Check, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Button, Badge, Tabs, TabsContent, Progress } from '@/components/ui';
import { api } from '@/api/client';
import { useReviewStore, useVersionStore } from '@/store';
import { getSeverityColor, getScoreColor, getRecommendationColor, formatDate } from '@/utils/helpers';
import { ISSUE_SEVERITY_LABELS, RECOMMENDATION_LABELS } from '../../../shared/types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import type { ReviewReport } from '../../../shared/types';

export function ReportView() {
  const { id } = useParams();
  const { currentVersion } = useVersionStore();
  const { review, moduleScores, issues, testFocuses, setReview, setModuleScores, setTestFocuses, setIssues } = useReviewStore();
  
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  
  useEffect(() => {
    if (id) {
      loadReport(id);
    }
  }, [id]);
  
  async function loadReport(versionId: string) {
    try {
      setLoading(true);
      const reportData = await api.reports.get(versionId);
      setReport(reportData);
      setReview(reportData.review);
      setModuleScores(reportData.moduleScores);
      setTestFocuses(reportData.testFocuses);
      setIssues(reportData.issues);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  }
  
  const riskColors = ['#E63946', '#FF9500', '#FFD700', '#2ECC71'];
  
  const riskChartData = [
    { name: '严重', value: report?.riskSummary.critical || 0, color: '#E63946' },
    { name: '高', value: report?.riskSummary.high || 0, color: '#FF9500' },
    { name: '中', value: report?.riskSummary.medium || 0, color: '#FFD700' },
    { name: '低', value: report?.riskSummary.low || 0, color: '#2ECC71' },
  ];
  
  const trendData = [
    { version: 'v1.0', score: 72 },
    { version: 'v1.1', score: 78 },
    { version: 'v1.2', score: 85 },
    { version: currentVersion?.versionNumber || 'v2.0', score: review?.overallScore || 0 },
  ];
  
  const tabs = [
    { id: 'summary', label: '评审报告', icon: <FileCheck className="w-4 h-4" /> },
    { id: 'risk', label: '风险汇总', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'decision', label: '发布决策', icon: <Check className="w-4 h-4" /> },
    { id: 'trend', label: '历史对比', icon: <TrendingUp className="w-4 h-4" /> },
  ];
  
  return (
    <div>
      <Header
        title="发布建议"
        subtitle={currentVersion ? `版本 ${currentVersion.versionNumber}` : ''}
        showBack
        actions={
          <Button variant="outline" onClick={() => {
            if (report) {
              const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `review-report-${currentVersion?.versionNumber || 'unknown'}.json`;
              a.click();
            }
          }}>
            <Download className="w-4 h-4 mr-2" />
            导出报告
          </Button>
        }
      />
      
      <div className="p-6">
        {loading ? (
          <div className="animate-pulse space-y-6">
            <Card className="h-32 bg-gray-100" />
            <Card className="h-64 bg-gray-100" />
          </div>
        ) : !report ? (
          <Card className="text-center py-12">
            <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">暂无评审报告</h3>
            <p className="text-sm text-gray-500">请先完成 AI 评审流程</p>
          </Card>
        ) : (
          <>
            <Card className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge className={getRecommendationColor(review?.recommendation || 'conditional')} size="md">
                      {RECOMMENDATION_LABELS[review?.recommendation || 'conditional']}
                    </Badge>
                    <span className={`text-4xl font-bold ${getScoreColor(review?.overallScore || 0)}`}>
                      {review?.overallScore || 0} 分
                    </span>
                  </div>
                  <p className="text-gray-600">{review?.summary}</p>
                  <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                    <span>评审时间: {formatDate(review?.createdAt || '')}</span>
                    <span>发现问题: {issues.length} 个</span>
                    <span>测试关注点: {testFocuses.length} 个</span>
                  </div>
                </div>
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {riskChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
            
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            
            <TabsContent>
              {activeTab === 'summary' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>模块评分详情</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {moduleScores.map((score) => (
                          <div key={score.id} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">{score.moduleName}</span>
                            <div className="flex items-center gap-3">
                              <Progress value={score.score} className="w-24" />
                              <span className={`text-sm font-bold ${getScoreColor(score.score)}`}>
                                {score.score}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>关键问题</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {issues.slice(0, 5).map((issue) => (
                          <div key={issue.id} className="flex items-start gap-2">
                            <Badge className={getSeverityColor(issue.severity)} size="sm">
                              {ISSUE_SEVERITY_LABELS[issue.severity]}
                            </Badge>
                            <span className="text-sm text-gray-900">{issue.title}</span>
                          </div>
                        ))}
                        {issues.length > 5 && (
                          <p className="text-xs text-gray-500">还有 {issues.length - 5} 个问题...</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>测试关注点</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {testFocuses.slice(0, 6).map((focus) => (
                          <div key={focus.id} className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              focus.priority === 1 ? 'bg-red-100 text-red-600' :
                              focus.priority === 2 ? 'bg-orange-100 text-orange-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {focus.priority}
                            </div>
                            <span className="text-sm text-gray-900">{focus.description}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>版本信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">版本号</span>
                          <span className="text-sm font-medium text-gray-900">{currentVersion?.versionNumber}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">计划发布日期</span>
                          <span className="text-sm font-medium text-gray-900">
                            {currentVersion?.releaseDate ? formatDate(currentVersion.releaseDate) : '未设定'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">版本状态</span>
                          <Badge variant="info">{currentVersion?.status}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {activeTab === 'risk' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>风险分布</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={riskChartData}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {riskChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>风险详情</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {['critical', 'high', 'medium', 'low'].map((severity) => {
                          const severityIssues = issues.filter((i) => i.severity === severity);
                          return (
                            <div key={severity} className="p-3 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <Badge className={getSeverityColor(severity)}>
                                  {ISSUE_SEVERITY_LABELS[severity]}
                                </Badge>
                                <span className="text-sm font-medium text-gray-900">
                                  {severityIssues.length} 个
                                </span>
                              </div>
                              {severityIssues.length > 0 && (
                                <div className="space-y-1">
                                  {severityIssues.slice(0, 3).map((issue) => (
                                    <p key={issue.id} className="text-xs text-gray-600 truncate">
                                      {issue.title}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {activeTab === 'decision' && (
                <div className="space-y-6">
                  <Card>
                    <div className="text-center py-8">
                      <div className={`inline-flex px-6 py-3 rounded-xl text-xl font-bold ${
                        review?.recommendation === 'recommend' ? 'bg-green-100 text-green-700' :
                        review?.recommendation === 'conditional' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {RECOMMENDATION_LABELS[review?.recommendation || 'conditional']}
                      </div>
                      <p className="mt-4 text-gray-600">
                        {review?.recommendation === 'recommend' && '本次版本质量良好，建议按计划发布'}
                        {review?.recommendation === 'conditional' && '本次版本存在部分问题，建议修复后发布'}
                        {review?.recommendation === 'not_recommend' && '本次版本存在严重问题，不建议发布'}
                      </p>
                    </div>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="text-center">
                      <div className="py-6">
                        <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <h4 className="font-medium text-gray-900">建议发布</h4>
                        <p className="text-xs text-gray-500 mt-1">评分 ≥ 90，无严重问题</p>
                      </div>
                    </Card>
                    <Card className="text-center">
                      <div className="py-6">
                        <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <h4 className="font-medium text-gray-900">有条件发布</h4>
                        <p className="text-xs text-gray-500 mt-1">评分 ≥ 70，问题可控</p>
                      </div>
                    </Card>
                    <Card className="text-center">
                      <div className="py-6">
                        <X className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <h4 className="font-medium text-gray-900">不建议发布</h4>
                        <p className="text-xs text-gray-500 mt-1">存在严重问题</p>
                      </div>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>发布前建议</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {testFocuses.filter((f) => f.priority <= 2).map((focus) => (
                          <div key={focus.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-gray-700">{focus.description}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {activeTab === 'trend' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>评分趋势</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="version" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="score"
                              stroke="#1E3A5F"
                              strokeWidth={2}
                              dot={{ fill: '#1E3A5F', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {report?.comparison && (
                    <Card>
                      <CardHeader>
                        <CardTitle>版本对比</CardTitle>
                        <CardDescription>
                          与上一版本 {report.comparison.previousVersion.versionNumber} 的对比
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">评分变化</span>
                              <div className={`flex items-center gap-1 ${
                                report.comparison.scoreChange >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {report.comparison.scoreChange >= 0 ? (
                                  <ArrowUpRight className="w-4 h-4" />
                                ) : (
                                  <ArrowDownRight className="w-4 h-4" />
                                )}
                                <span className="font-bold">
                                  {report.comparison.scoreChange >= 0 ? '+' : ''}{report.comparison.scoreChange}
                                </span>
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                              {review?.overallScore || 0} 分
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">问题数量变化</span>
                              <div className={`flex items-center gap-1 ${
                                report.comparison.issueCountChange <= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {report.comparison.issueCountChange <= 0 ? (
                                  <ArrowDownRight className="w-4 h-4" />
                                ) : (
                                  <ArrowUpRight className="w-4 h-4" />
                                )}
                                <span className="font-bold">
                                  {report.comparison.issueCountChange <= 0 ? '' : '+'}{report.comparison.issueCountChange}
                                </span>
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                              {issues.length} 个
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {!report?.comparison && (
                    <Card className="text-center py-8">
                      <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">暂无历史版本对比数据</p>
                    </Card>
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