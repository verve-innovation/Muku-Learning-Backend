import React, { useState } from 'react';
import { useTabData } from '../../hooks/useTabData';
import { useApi } from '../../hooks/useApi';
import { Progress } from '../../types';
import { DataTable } from './DataTable';
import { CrudModal } from '../modals/CrudModal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function ProgressTable() {
  const { data, loading, error, refetch, deleteRecord } = useTabData<Progress>('/progress');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Progress | null>(null);
  const { apiRequest } = useApi();

  const handleEdit = (progress: Progress) => {
    setEditingRecord(progress);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const endpoint = editingRecord ? `/progress/${editingRecord.id}` : '/progress';
      await apiRequest(endpoint, {
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
    { header: 'User', render: (p: Progress) => <strong>{p.user ? p.user.name : 'Deleted User'}</strong> },
    { header: 'Category', render: (p: Progress) => p.category ? p.category.name : 'Deleted Cat' },
    { header: 'Words Learned', accessor: 'wordsLearned' },
    { header: 'Accuracy', render: (p: Progress) => `${p.totalAnswers > 0 ? Math.round((p.correctAnswers / p.totalAnswers) * 100) : 0}%` },
    { header: 'Last Played', render: (p: Progress) => p.lastPlayedAt ? new Date(p.lastPlayedAt).toLocaleDateString() : 'Never' },
    { header: 'Actions', render: (p: Progress) => (
      <div>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] mr-[15px] cursor-pointer text-accent" onClick={() => handleEdit(p)}>Edit</button>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] cursor-pointer text-danger" onClick={() => deleteRecord(p.id)}>Delete</button>
      </div>
    )}
  ];

  if (loading) return <div className="text-text-muted">Fetching database records...</div>;
  if (error) return <div className="text-danger font-semibold">Error: {error}</div>;

  return (
    <>
      <DataTable columns={columns} data={data} onAdd={handleAdd} />
      
      <CrudModal 
        isOpen={modalOpen} 
        title={editingRecord ? 'Edit Progress' : 'Add New Progress'} 
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit}>
          {editingRecord && <input type="hidden" name="id" value={editingRecord.id} />}
          <Input label="User ID" name="userId" required defaultValue={editingRecord?.userId || ''} />
          <Input label="Category ID" name="categoryId" required defaultValue={editingRecord?.categoryId || ''} />
          
          <div className="grid grid-cols-3 gap-2.5">
            <Input type="number" label="Words Learned" name="wordsLearned" required defaultValue={editingRecord?.wordsLearned || 0} />
            <Input type="number" label="Correct Ans" name="correctAnswers" required defaultValue={editingRecord?.correctAnswers || 0} />
            <Input type="number" label="Total Ans" name="totalAnswers" required defaultValue={editingRecord?.totalAnswers || 0} />
          </div>

          <div className="flex justify-end gap-[15px] mt-[25px]">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="w-auto px-6 py-2.5">Cancel</Button>
            <Button type="submit" className="w-auto px-6 py-2.5">Save Changes</Button>
          </div>
        </form>
      </CrudModal>
    </>
  );
}
