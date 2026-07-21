import React, { useState } from 'react';
import { useTabData } from '../../hooks/useTabData';
import { useApi } from '../../hooks/useApi';
import { DataDeletionRequest } from '../../types';
import { DataTable } from './DataTable';
import { CrudModal } from '../modals/CrudModal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';

export function DeletionRequestsTable() {
  const { data, loading, error, refetch, deleteRecord } = useTabData<DataDeletionRequest>('/deletion-requests');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DataDeletionRequest | null>(null);
  const { apiRequest } = useApi();

  const handleEdit = (record: DataDeletionRequest) => {
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRecord) return;
    
    const formData = new FormData(e.currentTarget);
    const status = formData.get('status') as string;

    try {
      await apiRequest(`/deletion-requests/${editingRecord.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setModalOpen(false);
      refetch();
    } catch (err: any) {
      alert(`Error saving record: ${err.message}`);
    }
  };

  const columns = [
    { header: 'Date', render: (r: DataDeletionRequest) => new Date(r.createdAt).toLocaleDateString() },
    { header: 'Email', render: (r: DataDeletionRequest) => r.email },
    { header: 'Reason', render: (r: DataDeletionRequest) => <span className="truncate max-w-50 inline-block" title={r.reason}>{r.reason || '-'}</span> },
    { 
      header: 'Status', 
      render: (r: DataDeletionRequest) => (
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
          r.status === 'approved' ? 'bg-green-100 text-green-800' : 
          'bg-red-100 text-red-800'
        }`}>
          {r.status.toUpperCase()}
        </span>
      ) 
    },
    { header: 'Actions', render: (r: DataDeletionRequest) => (
      <div>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] mr-3.75 cursor-pointer text-accent" onClick={() => handleEdit(r)}>Update Status</button>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] cursor-pointer text-danger" onClick={() => deleteRecord(r.id)}>Delete</button>
      </div>
    )}
  ];

  if (loading) return <div className="text-text-muted">Fetching database records...</div>;
  if (error) return <div className="text-danger font-semibold">Error: {error}</div>;

  return (
    <>
      <DataTable columns={columns} data={data} />
      
      <CrudModal 
        isOpen={modalOpen} 
        title="Update Request Status" 
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <p className="text-sm text-text-muted mb-2"><strong>Email:</strong> {editingRecord?.email}</p>
            <p className="text-sm text-text-muted mb-4"><strong>Reason:</strong> {editingRecord?.reason || 'None provided'}</p>
          </div>

          <Select label="Status" name="status" defaultValue={editingRecord?.status || 'pending'}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>

          <div className="flex justify-end gap-3.75 mt-6.25">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="w-auto px-6 py-2.5">Cancel</Button>
            <Button type="submit" className="w-auto px-6 py-2.5">Save Changes</Button>
          </div>
        </form>
      </CrudModal>
    </>
  );
}
