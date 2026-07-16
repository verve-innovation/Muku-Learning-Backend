import React, { useState } from 'react';
import { useTabData } from '../../hooks/useTabData';
import { useApi } from '../../hooks/useApi';
import { Word } from '../../types';
import { DataTable } from './DataTable';
import { CrudModal } from '../modals/CrudModal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function WordsTable() {
  const { data, loading, error, refetch, deleteRecord } = useTabData<Word>('/words');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Word | null>(null);
  const { apiRequest } = useApi();

  const handleEdit = (word: Word) => {
    setEditingRecord(word);
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
      const endpoint = editingRecord ? `/words/${editingRecord.id}` : '/words';
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
    { header: 'Emoji', render: (w: Word) => <span className="text-[1.5rem]">{w.emoji}</span> },
    { header: 'Nepali', render: (w: Word) => <strong>{w.nepali}</strong> },
    { header: 'Roman', accessor: 'nepaliRoman' },
    { header: 'English', accessor: 'english' },
    { header: 'Category', render: (w: Word) => <span className="text-accent font-semibold">{w.category ? w.category.name : 'None'}</span> },
    { header: 'Order', accessor: 'order' },
    { header: 'Actions', render: (w: Word) => (
      <div>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] mr-[15px] cursor-pointer text-accent" onClick={() => handleEdit(w)}>Edit</button>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] cursor-pointer text-danger" onClick={() => deleteRecord(w.id)}>Delete</button>
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
        title={editingRecord ? 'Edit Word' : 'Add New Word'} 
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit}>
          {editingRecord && <input type="hidden" name="id" value={editingRecord.id} />}
          <Input label="Category ID" name="categoryId" required defaultValue={editingRecord?.categoryId || ''} placeholder="Paste UUID of Category" />
          
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="Nepali Text" name="nepali" required defaultValue={editingRecord?.nepali || ''} />
            <Input label="Roman Nepali" name="nepaliRoman" required defaultValue={editingRecord?.nepaliRoman || ''} />
          </div>
          
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="English Text" name="english" required defaultValue={editingRecord?.english || ''} />
            <Input label="Phonetic Pronunciation" name="phonetic" required defaultValue={editingRecord?.phonetic || ''} />
          </div>
          
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="Emoji" name="emoji" required defaultValue={editingRecord?.emoji || ''} />
            <Input type="number" label="Display Order" name="order" required defaultValue={editingRecord?.order || 0} />
          </div>
          
          <Input label="Audio URL (Optional)" name="audioUrl" defaultValue={editingRecord?.audioUrl || ''} />

          <div className="flex justify-end gap-[15px] mt-[25px]">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="w-auto px-6 py-2.5">Cancel</Button>
            <Button type="submit" className="w-auto px-6 py-2.5">Save Changes</Button>
          </div>
        </form>
      </CrudModal>
    </>
  );
}
