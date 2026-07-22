import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { TabType } from './Dashboard';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { logout } = useAuth();

  const menuItems: { id: TabType; icon: string; label: string }[] = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'users', icon: '👥', label: 'Users' },
    { id: 'categories', icon: '🗂️', label: 'Categories' },
    { id: 'words', icon: '📝', label: 'Words' },
    { id: 'progress', icon: '📈', label: 'Progress' },
    { id: 'sessions', icon: '🎓', label: 'Sessions' },
    { id: 'badges', icon: '🏆', label: 'Badges' },
    { id: 'user-badges', icon: '🏅', label: 'User Badges' },
    { id: 'deletion-requests', icon: '🗑️', label: 'Data Deletions' },
  ];

  return (
    <aside className="bg-bg-card border-r border-border-color flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-border-color font-title text-[1.4rem] font-extrabold flex items-center gap-2.5">
        <span>🐼</span> Muku Admin
      </div>
      <ul className="list-none px-2.5 py-5 grow overflow-y-auto">
        {menuItems.map(item => (
          <li 
            key={item.id}
            className={`px-4 py-3 rounded-xl cursor-pointer flex items-center gap-3 font-medium mb-1 transition-all duration-200 ${
              activeTab === item.id 
                ? 'text-text-main bg-bg-input border-l-4 border-accent pl-3' 
                : 'text-text-muted hover:text-text-main hover:bg-bg-input'
            }`}
            onClick={() => onTabChange(item.id)}
          >
            {item.icon} {item.label}
          </li>
        ))}
      </ul>
      <div className="p-5 border-t border-border-color flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="text-[1.5rem] bg-bg-input w-9 h-9 flex justify-center items-center rounded-full">
            🐼
          </div>
          <div className="text-[0.85rem] font-semibold">SysAdmin</div>
        </div>
        <button 
          className="bg-transparent border-none text-danger cursor-pointer font-semibold text-[0.85rem]"
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
