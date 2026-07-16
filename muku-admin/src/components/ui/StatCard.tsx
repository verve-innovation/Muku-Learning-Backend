import React from 'react';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
}

export function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="bg-bg-card border border-border-color rounded-[15px] p-6 flex items-center gap-5">
      <div className="text-[2rem] bg-bg-input w-[60px] h-[60px] flex items-center justify-center rounded-xl text-accent">
        {icon}
      </div>
      <div>
        <div className="text-[1.8rem] font-bold font-title leading-tight">{value}</div>
        <div className="text-text-muted text-[0.85rem] uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}
