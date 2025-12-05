import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import Whiteboard from './components/Whiteboard';
import Settings from './components/Settings';
import { ViewMode, UserRole } from './types';

function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.CEO);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);

  const renderContent = () => {
    switch (viewMode) {
      case ViewMode.DASHBOARD:
        return <Dashboard role={currentRole} />;
      case ViewMode.CHAT:
        return <Chat role={currentRole} />;
      case ViewMode.WHITEBOARD:
        return <Whiteboard role={currentRole} />;
      case ViewMode.SETTINGS:
        return <Settings />;
      default:
        return <Dashboard role={currentRole} />;
    }
  };

  return (
    <Layout 
      currentRole={currentRole} 
      setRole={setCurrentRole}
      viewMode={viewMode}
      setViewMode={setViewMode}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
