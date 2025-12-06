import React, { useState, useEffect } from 'react';
import { MsalProvider, useIsAuthenticated } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from './auth/authConfig';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import Whiteboard from './components/Whiteboard';
import Settings from './components/Settings';
import { Login } from './components/Login';
import { ViewMode, UserRole } from './types';
import { Loader2 } from 'lucide-react';

const msalInstance = new PublicClientApplication(msalConfig);

// Inner component to safely use the authentication hook
const MainContent = () => {
  const isAuthenticated = useIsAuthenticated();
  const [isDemoMode, setIsDemoMode] = useState(false);
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

  if (isAuthenticated || isDemoMode) {
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

  return <Login onDemoLogin={() => setIsDemoMode(true)} />;
};

function App() {
  const [isMsalInitialized, setIsMsalInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await msalInstance.initialize();
        // CRITICAL: Handle any redirect promises to clear "interaction_in_progress" states
        // This ensures if the app reloads during a popup/redirect, it resets.
        await msalInstance.handleRedirectPromise().catch(e => console.error("Redirect Error", e));
        setIsMsalInitialized(true);
      } catch (e) {
        console.error("MSAL Initialization failed:", e);
        setIsMsalInitialized(true); 
      }
    };
    init();
  }, []);

  if (!isMsalInitialized) {
    return (
      <div className="h-screen w-screen bg-[#0f111a] flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <MainContent />
    </MsalProvider>
  );
}

export default App;