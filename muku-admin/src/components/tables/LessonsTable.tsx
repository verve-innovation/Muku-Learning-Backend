import React, { useState } from 'react';
import { useTabData } from '../../hooks/useTabData';
import { useApi } from '../../hooks/useApi';
import { DataTable } from './DataTable';
import { CrudModal } from '../modals/CrudModal';
import { CsvImportModal } from '../modals/CsvImportModal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Lesson {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  order: number;
  category?: {
    id: string;
    slug: string;
    name: string;
  };
}

export function LessonsTable() {
  const { data, loading, error, refetch, deleteRecord } = useTabData<Lesson>('/lessons');
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Lesson | null>(null);
  const { apiRequest } = useApi();

  const importColumns = [
    { key: 'categorySlug', label: 'category_slug' },
    { key: 'slug', label: 'slug' },
    { key: 'name', label: 'name' },
    { key: 'order', label: 'order' },
  ];

  const importTemplate = {
    categorySlug: 'fruits',
    slug: 'fruits-lesson-1',
    name: 'Fruits Lesson 1',
    order: '1',
  };

  const columns = [
    { header: 'ID', render: (l: Lesson) => <span className="text-text-muted text-[0.8rem]">{l.id}</span> },
    { header: 'Name', render: (l: Lesson) => <strong>{l.name}</strong> },
    { header: 'Slug', accessor: 'slug' },
    { header: 'Category', render: (l: Lesson) => <span className="text-accent font-semibold">{l.category ? l.category.name : l.categoryId}</span> },
    { header: 'Order', accessor: 'order' },
    { header: 'Actions', render: (l: Lesson) => (
      <div>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] mr-[15px] cursor-pointer text-accent" onClick={() => { setEditingRecord(l); setModalOpen(true); }}>Edit</button>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] cursor-pointer text-danger" onClick={() => deleteRecord(l.id)}>Delete</button>
      </div>
    )}
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: Record<string, any> = Object.fromEntries(formData.entries());
    if (payload.order) payload.order = parseInt(payload.order as string);

    try {
      if (editingRecord?.id) {
        await apiRequest(`/lessons/${editingRecord.id}`, { method: 'POST', body: JSON.stringify(payload) });
      } else {
        await apiRequest('/lessons', { method: 'POST', body: JSON.stringify(payload) });
      }
      setModalOpen(false);
      refetch();
    } catch (err: any) {
      alert(`Error saving record: ${err.message}`);
    }
  };

  if (loading) return <div className="text-text-muted">Fetching database records...</div>;
  if (error) return <div className="text-danger font-semibold">Error: {error}</div>;

  return (
    <>
      <DataTable 
        columns={columns} 
        data={data} 
        onAdd={() => { setEditingRecord(null); setModalOpen(true); }} 
        onImport={() => setImportOpen(true)} 
      />

      <CsvImportModal 
        isOpen={importOpen} 
        onClose={() => setImportOpen(false)} 
        onSuccess={refetch} 
        endpoint="/lessons/import" 
        tableName="Lessons" 
        columns={importColumns} 
        templateRow={importTemplate} 
      />

      <CrudModal isOpen={modalOpen} title={editingRecord ? 'Edit Lesson' : 'Add New Lesson'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          {editingRecord && <input type="hidden" name="id" value={editingRecord.id} />}
          <Input label="Category ID" name="categoryId" required defaultValue={editingRecord?.categoryId || ''} placeholder="UUID of category" />
          <Input label="Slug" name="slug" required defaultValue={editingRecord?.slug || ''} placeholder="e.g. fruits-lesson-1" />
          <Input label="Name" name="name" required defaultValue={editingRecord?.name || ''} placeholder="Lesson Name" />
          <Input type="number" label="Display Order" name="order" required defaultValue={editingRecord?.order || 1} />
          <div className="flex justify-end gap-[15px] mt-[25px]">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="w-auto px-6 py-2.5">Cancel</Button>
            <Button type="submit" className="w-auto px-6 py-2.5">Save Changes</Button>
          </div>
        </form>
      </CrudModal>
    </>
  );
}
