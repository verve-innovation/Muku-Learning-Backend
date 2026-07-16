import React, { useState } from 'react';
import { useTabData } from '../../hooks/useTabData';
import { useApi } from '../../hooks/useApi';
import { User } from '../../types';
import { DataTable } from './DataTable';
import { CrudModal } from '../modals/CrudModal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';

function getAvatarEmoji(name: string) {
  switch(name) {
    case 'Kanchha': return '🐼';
    case 'Mayur': return '🦚';
    case 'Danphe': return '🦅';
    case 'Mojo': return '🐵';
    default: return '👤';
  }
}

export function UsersTable() {
  const { data, loading, error, refetch, deleteRecord } = useTabData<User>('/users');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<User | null>(null);
  const { apiRequest } = useApi();

  const handleEdit = (user: User) => {
    setEditingRecord(user);
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
    payload.onboarded = formData.has('onboarded') as any;

    try {
      const endpoint = editingRecord ? `/users/${editingRecord.id}` : '/users';
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
    { header: 'Avatar', render: (u: User) => <span className="text-[1.5rem]">{getAvatarEmoji(u.avatar)}</span> },
    { header: 'Name', render: (u: User) => <strong>{u.name}</strong> },
    { header: 'Username', render: (u: User) => `@${u.username}` },
    { header: 'XP', render: (u: User) => `⭐ ${u.xp}` },
    { header: 'Streak', render: (u: User) => `🔥 ${u.streak}` },
    { header: 'Hearts', render: (u: User) => `❤️ ${u.hearts}` },
    { header: 'Actions', render: (u: User) => (
      <div>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] mr-[15px] cursor-pointer text-accent" onClick={() => handleEdit(u)}>Edit</button>
        <button className="bg-transparent border-none font-semibold text-[0.85rem] cursor-pointer text-danger" onClick={() => deleteRecord(u.id)}>Delete</button>
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
        title={editingRecord ? 'Edit User' : 'Add New User'} 
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit}>
          {editingRecord && <input type="hidden" name="id" value={editingRecord.id} />}
          <Input label="Display Name" name="name" required defaultValue={editingRecord?.name || ''} />
          <Input label="Username" name="username" required defaultValue={editingRecord?.username || ''} />
          
          <Select label="Avatar" name="avatar" defaultValue={editingRecord?.avatar || 'Kanchha'}>
            <option value="Kanchha">Kanchha (Panda)</option>
            <option value="Mayur">Mayur (Peacock)</option>
            <option value="Danphe">Danphe (Lophophorus)</option>
            <option value="Mojo">Mojo (Monkey)</option>
          </Select>

          <Input label="Locality" name="locality" defaultValue={editingRecord?.locality || ''} />
          
          <div className="grid grid-cols-3 gap-2.5">
            <Input type="number" label="XP" name="xp" required defaultValue={editingRecord?.xp || 0} />
            <Input type="number" label="Streak" name="streak" required defaultValue={editingRecord?.streak || 0} />
            <Input type="number" label="Hearts" name="hearts" required defaultValue={editingRecord?.hearts || 5} />
          </div>
          
          <div className="mb-5 flex items-center gap-2">
            <input type="checkbox" name="onboarded" id="onboarded" defaultChecked={editingRecord?.onboarded !== false} />
            <label htmlFor="onboarded" className="text-[0.85rem] font-semibold text-text-muted">Onboarded?</label>
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
