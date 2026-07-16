import React, { useState } from 'react';
import { useTabData } from '../../hooks/useTabData';
import { useApi } from '../../hooks/useApi';
import { Category } from '../../types';
import { DataTable } from './DataTable';
import { CrudModal } from '../modals/CrudModal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function CategoriesTable() {
  const { data, loading, error, refetch, deleteRecord } = useTabData<Category>('/categories');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Category | null>(null);
  const { apiRequest } = useApi();

  const handleEdit = (category: Category) => {
    setEditingRecord(category);
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
    payload.isLocked = formData.has('isLocked') as any;

    try {
      const endpoint = editingRecord ? `/categories/${editingRecord.id}` : '/categories';
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
    { header: 'Emoji', render: (c: Category) => <span className="text-[1.5rem]">{c.emoji}</span> },
    { header: 'Name', render: (c: Category) => <strong>{c.name}</strong> },
    { header: 'Slug', render: (c: Category) => <code>{c.slug}</code> },
    { header: 'Order', accessor: 'order' },
    { header: 'Locked?', render: (c: Category) => c.isLocked ? '🔒 Yes' : '🔓 No' },
    { header: 'Unlock Lvl', accessor: 'unlockLevel' },
    { header: 'Actions', render: (c: Category) => (
      <div>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] mr-[15px] cursor-pointer text-accent" onClick={() => handleEdit(c)}>Edit</button>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] cursor-pointer text-danger" onClick={() => deleteRecord(c.id)}>Delete</button>
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
        title={editingRecord ? 'Edit Category' : 'Add New Category'} 
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit}>
          {editingRecord && <input type="hidden" name="id" value={editingRecord.id} />}
          <Input label="Category Name" name="name" required defaultValue={editingRecord?.name || ''} />
          <Input label="Slug" name="slug" required defaultValue={editingRecord?.slug || ''} placeholder="e.g. greetings" />
          <Input label="Emoji" name="emoji" required defaultValue={editingRecord?.emoji || ''} placeholder="e.g. 👋" />
          
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="Color" name="color" required defaultValue={editingRecord?.color || '#FFFDE7'} />
            <Input label="Border Color" name="borderColor" required defaultValue={editingRecord?.borderColor || '#FFF9C4'} />
          </div>
          
          <div className="grid grid-cols-2 gap-2.5">
            <Input type="number" label="Display Order" name="order" required defaultValue={editingRecord?.order || 0} />
            <Input type="number" label="Unlock Level" name="unlockLevel" required defaultValue={editingRecord?.unlockLevel || 0} />
          </div>
          
          <div className="mb-5 flex items-center gap-2">
            <input type="checkbox" name="isLocked" id="isLocked" defaultChecked={editingRecord?.isLocked} />
            <label htmlFor="isLocked" className="text-[0.85rem] font-semibold text-text-muted">Locked?</label>
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
