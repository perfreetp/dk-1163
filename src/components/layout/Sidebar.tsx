import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { cn } from '@/utils/helpers';
import {
  Layers,
  FileText,
  Brain,
  AlertTriangle,
  FileCheck,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { id: 'versions', label: '版本空间', icon: Layers, path: '/versions' },
  { id: 'requirements', label: '需求清单', icon: FileText, path: '/versions/:id/requirements' },
  { id: 'review', label: 'AI 评审', icon: Brain, path: '/versions/:id/review' },
  { id: 'issues', label: '问题跟踪', icon: AlertTriangle, path: '/versions/:id/issues' },
  { id: 'report', label: '发布建议', icon: FileCheck, path: '/versions/:id/report' },
];

export function Sidebar() {
  const { id } = useParams();
  
  return (
    <aside className="w-64 bg-[#1E3A5F] text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#00B4D8] flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">AI 评审助手</h1>
            <p className="text-xs text-white/60">版本验收智能评审</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const path = item.path.includes(':id') && id ? item.path.replace(':id', id) : item.path;
            const isActive = item.id === 'versions' && !id;
            
            return (
              <li key={item.id}>
                <NavLink
                  to={path}
                  className={({ isActive: navIsActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                      (navIsActive || isActive)
                        ? 'bg-white/15 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {(item.path.includes(':id') && !id) && (
                    <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-white/50">
          <p>AI 版本评审助手 v1.0</p>
          <p className="mt-1">© 2026 智能评审系统</p>
        </div>
      </div>
    </aside>
  );
}