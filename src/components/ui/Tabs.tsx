import React from 'react';
import { cn } from '@/utils/helpers';

interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex border-b border-gray-200', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative',
            activeTab === tab.id
              ? 'text-[#1E3A5F] border-b-2 border-[#1E3A5F]'
              : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface TabsContentProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ children, className }: TabsContentProps) {
  return <div className={cn('py-4', className)}>{children}</div>;
}