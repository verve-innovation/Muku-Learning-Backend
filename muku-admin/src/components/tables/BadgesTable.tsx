import React, { useState } from 'react';
import { useTabData } from '../../hooks/useTabData';
import { useApi } from '../../hooks/useApi';
import { Badge } from '../../types';
import { DataTable } from './DataTable';
import { CrudModal } from '../modals/CrudModal';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';

export function BadgesTable() {
  const { data, loading, error, refetch, deleteRecord } = useTabData<Badge>('/badges');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Badge | null>(null);
  const { apiRequest } = useApi();

  const handleEdit = (badge: Badge) => {
    setEditingRecord(badge);
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
      const endpoint = editingRecord ? `/badges/${editingRecord.id}` : '/badges';
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
    { header: 'Emoji', render: (b: Badge) => <span className="text-[1.5rem]">{b.emoji}</span> },
    { header: 'Badge Name', render: (b: Badge) => <strong>{b.name}</strong> },
    { header: 'Slug', render: (b: Badge) => <code>{b.slug}</code> },
    { header: 'Description', accessor: 'description' },
    { header: 'Actions', render: (b: Badge) => (
      <div>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] mr-[15px] cursor-pointer text-accent" onClick={() => handleEdit(b)}>Edit</button>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] cursor-pointer text-danger" onClick={() => deleteRecord(b.id)}>Delete</button>
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
        title={editingRecord ? 'Edit Badge' : 'Add New Badge'} 
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit}>
          {editingRecord && <input type="hidden" name="id" value={editingRecord.id} />}
          <Input label="Badge Name" name="name" required defaultValue={editingRecord?.name || ''} />
          <Input label="Slug" name="slug" required defaultValue={editingRecord?.slug || ''} />
          <Input label="Emoji Icon" name="emoji" required defaultValue={editingRecord?.emoji || ''} placeholder="e.g. 🏆" />
          <Textarea label="Description" name="description" defaultValue={editingRecord?.description || ''} className="h-20" />

          <div className="flex justify-end gap-[15px] mt-[25px]">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="w-auto px-6 py-2.5">Cancel</Button>
            <Button type="submit" className="w-auto px-6 py-2.5">Save Changes</Button>
          </div>
        </form>
      </CrudModal>
    </>
  );
}
