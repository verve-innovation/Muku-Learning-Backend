import React, { useState } from 'react';
import { useTabData } from '../../hooks/useTabData';
import { useApi } from '../../hooks/useApi';
import { UserBadge } from '../../types';
import { DataTable } from './DataTable';
import { CrudModal } from '../modals/CrudModal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function UserBadgesTable() {
  const { data, loading, error, refetch, deleteRecord } = useTabData<UserBadge>('/user-badges');
  const [modalOpen, setModalOpen] = useState(false);
  const { apiRequest } = useApi();

  const handleAdd = () => {
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      // NOTE: This assumes the original system had a POST /user-badges endpoint to create one
      await apiRequest('/user-badges', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setModalOpen(false);
      refetch();
    } catch (err: any) {
      alert(`Error saving record: ${err.message}`);
    }
  };

  const columns = [
    { header: 'User', render: (ub: UserBadge) => <strong>{ub.user ? ub.user.name : 'Deleted User'}</strong> },
    { header: 'Badge Awarded', render: (ub: UserBadge) => (
      <>
        <span className="text-[1.2rem] mr-1.5">{ub.badge ? ub.badge.emoji : ''}</span> 
        {ub.badge ? ub.badge.name : 'Deleted Badge'}
      </>
    )},
    { header: 'Awarded At', render: (ub: UserBadge) => new Date(ub.awardedAt).toLocaleString() },
    { header: 'Actions', render: (ub: UserBadge) => (
      <div>
        <button 
          className="bg-transparent border-none font-semibold text-[0.85rem] cursor-pointer text-danger" 
          onClick={() => deleteRecord(`${ub.userId}/${ub.badgeId}`, `/user-badges/${ub.userId}/${ub.badgeId}`)}
        >
          Revoke
        </button>
      </div>
    )}
  ];

  if (loading) return <div className="text-text-muted">Fetching database records...</div>;
  if (error) return <div className="text-danger font-semibold">Error: {error}</div>;

  return (
    <>
      <DataTable columns={columns} data={data} onAdd={handleAdd} addLabel="Award Badge" />
      
      <CrudModal 
        isOpen={modalOpen} 
        title="Award Badge to User" 
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit}>
          <Input label="User ID" name="userId" required placeholder="User UUID" />
          <Input label="Badge ID" name="badgeId" required placeholder="Badge UUID" />

          <div className="flex justify-end gap-[15px] mt-[25px]">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="w-auto px-6 py-2.5">Cancel</Button>
            <Button type="submit" className="w-auto px-6 py-2.5">Award Badge</Button>
          </div>
        </form>
      </CrudModal>
    </>
  );
}
