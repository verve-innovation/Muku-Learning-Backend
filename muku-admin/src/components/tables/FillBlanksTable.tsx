import React, { useState } from 'react';
import { useTabData } from '../../hooks/useTabData';
import { useApi } from '../../hooks/useApi';
import { DataTable } from './DataTable';
import { CrudModal } from '../modals/CrudModal';
import { CsvImportModal } from '../modals/CsvImportModal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FillBlank } from '../../types';

export function FillBlanksTable() {
  const { data, loading, error, refetch, deleteRecord } = useTabData<FillBlank>('/fill-blanks');
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FillBlank | null>(null);
  const { apiRequest } = useApi();

  const importColumns = [
    { key: 'Lesson_slug', label: 'Lesson_slug' },
    { key: 'word_nepali', label: 'word_nepali' },
    { key: 'sentenceTemplate', label: 'sentenceTemplate' },
    { key: 'blankAnswer', label: 'blankAnswer' },
    { key: 'englishHint', label: 'englishHint' },
    { key: 'emoji', label: 'emoji' },
    { key: 'order', label: 'order' },
  ];

  const importTemplate = {
    Lesson_slug: 'fruits-lesson-1',
    word_nepali: 'केला',
    sentenceTemplate: 'म ___ खान्छु।',
    blankAnswer: 'केरा',
    englishHint: 'I eat Banana',
    emoji: '🍌',
    order: '1',
  };

  const columns = [
    { header: 'Emoji', render: (f: FillBlank) => <span className="text-[1.5rem]">{f.emoji}</span> },
    { header: 'Sentence', accessor: 'sentenceTemplate' },
    { header: 'Answer', render: (f: FillBlank) => <span className="text-accent font-semibold">{f.blankAnswer}</span> },
    { header: 'Hint', accessor: 'englishHint' },
    { header: 'Lesson', render: (f: FillBlank) => f.lesson ? <span className="text-text-muted text-[0.8rem]">{f.lesson.slug}</span> : f.lessonId },
    { header: 'Word', render: (f: FillBlank) => f.word ? <strong>{f.word.nepali}</strong> : f.wordId },
    { header: 'Order', accessor: 'order' },
    { header: 'Actions', render: (f: FillBlank) => (
      <div>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] mr-3.75 cursor-pointer text-accent" onClick={() => { setEditingRecord(f); setModalOpen(true); }}>Edit</button>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] cursor-pointer text-danger" onClick={() => deleteRecord(f.id)}>Delete</button>
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
        await apiRequest(`/fill-blanks/${editingRecord.id}`, { method: 'POST', body: JSON.stringify(payload) });
      } else {
        await apiRequest('/fill-blanks', { method: 'POST', body: JSON.stringify(payload) });
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
      <DataTable columns={columns} data={data} onAdd={() => { setEditingRecord(null); setModalOpen(true); }} onImport={() => setImportOpen(true)} />

      <CsvImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} onSuccess={refetch} endpoint="/fill-blanks/import" tableName="Fill Blanks" columns={importColumns} templateRow={importTemplate} />

      <CrudModal isOpen={modalOpen} title={editingRecord ? 'Edit Fill Blank' : 'Add New Fill Blank'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          {editingRecord && <input type="hidden" name="id" value={editingRecord.id} />}
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="Lesson ID" name="lessonId" required defaultValue={editingRecord?.lessonId || ''} />
            <Input label="Word ID" name="wordId" required defaultValue={editingRecord?.wordId || ''} />
          </div>
          <Input label="Sentence Template (use ___ for blank)" name="sentenceTemplate" required defaultValue={editingRecord?.sentenceTemplate || ''} />
          
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="Blank Answer" name="blankAnswer" required defaultValue={editingRecord?.blankAnswer || ''} />
            <Input label="English Hint" name="englishHint" required defaultValue={editingRecord?.englishHint || ''} />
          </div>
          
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="Emoji" name="emoji" required defaultValue={editingRecord?.emoji || ''} />
            <Input type="number" label="Display Order" name="order" required defaultValue={editingRecord?.order || 0} />
          </div>
          <div className="flex justify-end gap-3.75 mt-6.25">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="w-auto px-6 py-2.5">Cancel</Button>
            <Button type="submit" className="w-auto px-6 py-2.5">Save Changes</Button>
          </div>
        </form>
      </CrudModal>
    </>
  );
}
