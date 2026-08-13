import React, { useState } from 'react';
import { useTabData } from '../../hooks/useTabData';
import { useApi } from '../../hooks/useApi';
import { Word } from '../../types';
import { DataTable } from './DataTable';
import { CrudModal } from '../modals/CrudModal';
import { CsvImportModal } from '../modals/CsvImportModal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function WordsTable() {
  const { data, loading, error, refetch, deleteRecord } = useTabData<Word>('/words');
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Word | null>(null);
  const { apiRequest } = useApi();

  const importColumns = [
    { key: 'categorySlug', label: 'category_slug' },
    { key: 'nepali', label: 'nepali' },
    { key: 'nepaliRoman', label: 'nepaliRoman' },
    { key: 'english', label: 'english' },
    { key: 'lessonSlug', label: 'lesson_slug' },
    { key: 'phonetic', label: 'phonetic' },
    { key: 'emoji', label: 'emoji' },
    { key: 'order', label: 'order' },
    { key: 'audioUrl', label: 'audioUrl' },
  ];

  const importTemplate = {
    categorySlug: 'fruits',
    nepali: 'केला',
    nepaliRoman: 'kela',
    english: 'banana',
    lessonSlug: 'lesson-1',
    phonetic: 'bəˈnænə',
    emoji: '🍌',
    order: '1',
    audioUrl: '',
  };

  const columns = [
    { header: 'Emoji', render: (w: Word) => <span className="text-[1.5rem]">{w.emoji}</span> },
    { header: 'Nepali', render: (w: Word) => <strong>{w.nepali}</strong> },
    { header: 'Roman', accessor: 'nepaliRoman' },
    { header: 'English', accessor: 'english' },
    { header: 'Category', render: (w: Word) => <span className="text-accent font-semibold">{w.category ? w.category.name : 'None'}</span> },
    { header: 'Lesson', render: (w: Word) => w.lesson ? <span className="text-text-muted text-[0.8rem]">{w.lesson.slug}</span> : '-'},
    { header: 'Order', accessor: 'order' },
    { header: 'Actions', render: (w: Word) => (
      <div>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] mr-3.75 cursor-pointer text-accent" onClick={() => { setEditingRecord(w); setModalOpen(true); }}>Edit</button>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] cursor-pointer text-danger" onClick={() => deleteRecord(w.id)}>Delete</button>
      </div>
    )}
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: Record<string, any> = Object.fromEntries(formData.entries());
    if (payload.order) payload.order = parseInt(payload.order as string);

    try {
      await apiRequest('/words', { method: 'POST', body: JSON.stringify(payload) });
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
      <DataTable columns={columns} data={data} onAdd={() => { setEditingRecord(null); setModalOpen(true); }} onImport={() => setImportOpen(true)} />

      <CsvImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} onSuccess={refetch} endpoint="/words/import" tableName="Words" columns={importColumns} templateRow={importTemplate} />

      <CrudModal isOpen={modalOpen} title={editingRecord ? 'Edit Word' : 'Add New Word'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          {editingRecord && <input type="hidden" name="id" value={editingRecord.id} />}
          <Input label="Nepali Text" name="nepali" required defaultValue={editingRecord?.nepali || ''} />
          <Input label="Roman Nepali" name="nepaliRoman" required defaultValue={editingRecord?.nepaliRoman || ''} />
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="English Text" name="english" required defaultValue={editingRecord?.english || ''} />
            <Input label="Phonetic Pronunciation" name="phonetic" required defaultValue={editingRecord?.phonetic || ''} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="Emoji" name="emoji" required defaultValue={editingRecord?.emoji || ''} />
            <Input type="number" label="Display Order" name="order" required defaultValue={editingRecord?.order || 0} />
          </div>
          <Input label="Audio URL (Optional)" name="audioUrl" defaultValue={editingRecord?.audioUrl || ''} />
          <div className="flex justify-end gap-3.75 mt-6.25">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="w-auto px-6 py-2.5">Cancel</Button>
            <Button type="submit" className="w-auto px-6 py-2.5">Save Changes</Button>
          </div>
        </form>
      </CrudModal>
    </>
  );
}
