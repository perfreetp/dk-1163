import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui';
import { useVersionStore } from '@/store';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showBack?: boolean;
}

export function Header({ title, subtitle, actions, showBack = false }: HeaderProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentVersion } = useVersionStore();
  
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {showBack && (
          <button
            onClick={() => navigate('/versions')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {currentVersion && id && (
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
            <span className="text-sm text-gray-600">当前版本:</span>
            <span className="text-sm font-medium text-[#1E3A5F]">{currentVersion.versionNumber}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {actions}
      </div>
    </header>
  );
}