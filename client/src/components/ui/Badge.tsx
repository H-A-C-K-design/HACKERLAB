import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'teal' | 'success' | 'danger' | 'warning' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  dot = false,
}) => {
  const variantStyles = {
    cyan: 'bg-cyan-950/70 text-cyan-300 border-cyan-400/30',
    teal: 'bg-teal-950/70 text-teal-300 border-teal-400/30',
    success: 'bg-emerald-950/70 text-emerald-300 border-emerald-400/30',
    danger: 'bg-rose-950/70 text-rose-300 border-rose-400/30',
    warning: 'bg-amber-950/70 text-amber-300 border-amber-400/30',
    purple: 'bg-purple-950/70 text-purple-300 border-purple-400/30',
    slate: 'bg-slate-800/70 text-slate-300 border-slate-700',
  };

  const dotColors = {
    cyan: 'bg-cyan-400',
    teal: 'bg-teal-400',
    success: 'bg-emerald-400 animate-pulse',
    danger: 'bg-rose-400',
    warning: 'bg-amber-400',
    purple: 'bg-purple-400',
    slate: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}></span>}
      {children}
    </span>
  );
};
