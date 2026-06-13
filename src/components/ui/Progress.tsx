import React from 'react';
import { cn } from '@/utils/helpers';

interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  className?: string;
}

export function Progress({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };
  
  const colors = {
    primary: 'bg-[#1E3A5F]',
    success: 'bg-[#2ECC71]',
    warning: 'bg-[#FF9500]',
    error: 'bg-[#E63946]',
  };
  
  const getBarColor = () => {
    if (percentage >= 90) return 'bg-[#2ECC71]';
    if (percentage >= 70) return 'bg-[#00B4D8]';
    if (percentage >= 50) return 'bg-[#FF9500]';
    return 'bg-[#E63946]';
  };
  
  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1 text-sm text-gray-600">
          <span>进度</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', getBarColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}