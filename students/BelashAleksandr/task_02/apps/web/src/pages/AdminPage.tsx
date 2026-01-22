import { useState } from 'react';
import './AdminPage.css';
import UsersManagement from './admin/UsersManagement';
import SourcesManagement from './admin/SourcesManagement';
import TagsManagement from './admin/TagsManagement';

type Tab = 'users' | 'sources' | 'tags';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  return (
    <div className="admin-page">
      <h1>Панель администратора</h1>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Пользователи
        </button>
        <button
          className={`tab-btn ${activeTab === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveTab('sources')}
        >
          Источники
        </button>
        <button
          className={`tab-btn ${activeTab === 'tags' ? 'active' : ''}`}
          onClick={() => setActiveTab('tags')}
        >
          Теги
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'users' && <UsersManagement />}
        {activeTab === 'sources' && <SourcesManagement />}
        {activeTab === 'tags' && <TagsManagement />}
      </div>
    </div>
  );
}
