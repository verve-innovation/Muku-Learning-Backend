import React from 'react';
import { useTabData } from '../../hooks/useTabData';
import { Session } from '../../types';
import { DataTable } from './DataTable';

export function SessionsTable() {
  const { data, loading, error, deleteRecord } = useTabData<Session>('/sessions');

  const columns = [
    { header: 'User', render: (s: Session) => <strong>{s.user ? s.user.name : 'Deleted User'}</strong> },
    { header: 'Category', render: (s: Session) => s.category ? s.category.name : 'Deleted Cat' },
    { header: 'XP Gained', render: (s: Session) => `⭐ +${s.xpGained}` },
    { header: 'Accuracy', render: (s: Session) => `${Math.round(s.accuracy * 100)}%` },
    { header: 'Duration (s)', render: (s: Session) => `⏱️ ${s.durationSec}s` },
    { header: 'Locality', render: (s: Session) => `📍 ${s.locality || 'Global'}` },
    { header: 'Date', render: (s: Session) => new Date(s.completedAt).toLocaleString() },
    { header: 'Actions', render: (s: Session) => (
      <div>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] cursor-pointer text-danger" onClick={() => deleteRecord(s.id)}>Delete</button>
      </div>
    )}
  ];

  if (loading) return <div className="text-text-muted">Fetching database records...</div>;
  if (error) return <div className="text-danger font-semibold">Error: {error}</div>;

  return <DataTable columns={columns} data={data} />;
}
