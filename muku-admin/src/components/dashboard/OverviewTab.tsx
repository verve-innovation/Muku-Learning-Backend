import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { StatCard } from '../ui/StatCard';
import { OverviewStats } from '../../types';

export function OverviewTab() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [error, setError] = useState('');
  const { apiRequest } = useApi();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiRequest<OverviewStats>('/tables');
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchStats();
  }, []);

  if (error) {
    return <div className="text-danger font-semibold">Error: {error}. Make sure the backend server is running and accessible.</div>;
  }

  if (!stats) {
    return <div className="text-text-muted">Fetching database records...</div>;
  }

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 mb-10">
        <StatCard icon="👥" value={stats.users} label="Users" />
        <StatCard icon="🗂️" value={stats.categories} label="Categories" />
        <StatCard icon="📝" value={stats.words} label="Words" />
        <StatCard icon="🏆" value={stats.badges} label="Badges" />
      </div>

      <div className="bg-bg-card p-[30px] rounded-[15px] border border-border-color">
        <h4 className="font-title text-[1.2rem] mb-[15px]">Database Integrity Console</h4>
        <p className="text-text-muted text-[0.9rem] leading-[1.6]">
          Welcome to the Muku Admin Control Center. You are currently connected with <strong>superuser bypass context</strong>, meaning Row-Level Security (RLS) is disabled for admin updates, permitting direct edits across all schema records. Make modifications with caution as updates propagate instantly.
        </p>
      </div>
    </>
  );
}
