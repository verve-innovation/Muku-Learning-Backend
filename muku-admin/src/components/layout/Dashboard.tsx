import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { OverviewTab } from '../dashboard/OverviewTab';
import { UsersTable } from '../tables/UsersTable';
import { CategoriesTable } from '../tables/CategoriesTable';
import { WordsTable } from '../tables/WordsTable';
import { ProgressTable } from '../tables/ProgressTable';
import { SessionsTable } from '../tables/SessionsTable';
import { BadgesTable } from '../tables/BadgesTable';
import { UserBadgesTable } from '../tables/UserBadgesTable';

export type TabType = 'overview' | 'users' | 'categories' | 'words' | 'progress' | 'sessions' | 'badges' | 'user-badges';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { apiUrl, setApiUrl } = useAuth();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'users': return <UsersTable />;
      case 'categories': return <CategoriesTable />;
      case 'words': return <WordsTable />;
      case 'progress': return <ProgressTable />;
      case 'sessions': return <SessionsTable />;
      case 'badges': return <BadgesTable />;
      case 'user-badges': return <UserBadgesTable />;
      default: return <OverviewTab />;
    }
  };

  const getTabTitle = () => {
    return activeTab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="grid grid-cols-[260px_1fr] min-h-screen">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="p-10 overflow-y-auto max-h-screen">
        <div className="flex justify-between bg-bg-card border border-border-color rounded-xl px-6 py-3 mb-[30px] items-center">
          <span className="text-[0.85rem] font-semibold text-text-muted">Connected API:</span>
          <input 
            type="text" 
            className="bg-bg-input border border-border-color rounded-lg px-4 py-2 text-text-main w-[250px] outline-none text-[0.85rem]" 
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
          />
        </div>

        <div className="flex justify-between items-center mb-[30px]">
          <h2 className="font-title text-[2rem] font-extrabold">{getTabTitle()}</h2>
          <div id="tab-header-actions"></div>
        </div>

        <div id="tab-content">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}
