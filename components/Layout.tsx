import React, { useState, useEffect } from 'react';
import { ViewMode, UserRole } from '../types';
import { useMsal } from "@azure/msal-react";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Trello, 
  Settings, 
  ShieldCheck, 
  Menu,
  ChevronDown,
  X,
  Zap,
  Cpu,
  LogOut,
  Workflow,
  Bug,
  Share2,
  MessageCircle,
  Video
} from 'lucide-react';

interface LayoutProps {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  children: React.ReactNode;
}

const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <path d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40Z" fill="url(#paint0_linear)"/>
    <path d="M12 20L20 12L28 20L20 28L12 20Z" fill="white" fillOpacity="0.9"/>
    <path d="M20 12V8M28 20H32M20 28V32M12 20H8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <defs>
      <linearGradient id="paint0_linear" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C3AED"/>
        <stop offset="1" stopColor="#E30613"/>
      </linearGradient>
    </defs>
  </svg>
);

const Layout: React.FC<LayoutProps> = ({ currentRole, setRole, viewMode, setViewMode, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // MSAL Authentication Hook
  const { instance, accounts } = useMsal();
  const userData = accounts[0] || { name: 'Guest User', username: 'guest@skyc.ai' };
  
  // Extract Initials
  const getInitials = (name: string) => {
      const parts = name.split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    instance.logoutPopup().catch(e => console.error(e));
  };

  // Handle responsive resizing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobile(true);
        setIsSidebarOpen(false);
      } else {
        setIsMobile(false);
        setIsSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { mode: ViewMode.DASHBOARD, icon: LayoutDashboard, label: 'Ops Dashboard' },
    { mode: ViewMode.CHAT, icon: Cpu, label: 'Neural Uplink' }, 
    { mode: ViewMode.WHITEBOARD, icon: Trello, label: 'Workspace' },
    { mode: ViewMode.SETTINGS, icon: Settings, label: 'Settings' },
  ];

  // Integration Status Icons (Simulated Active State)
  const IntegrationStatus = ({ icon: Icon, active, color }: any) => (
      <div className={`relative p-1.5 rounded-md transition-colors ${active ? 'bg-slate-100 hover:bg-slate-200' : 'opacity-20 grayscale'}`}>
          <Icon size={16} className={color} />
          {active && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-white"></span>}
      </div>
  );

  const SidebarContent = () => (
    <>
      {/* Draggable Header Area for Sidebar */}
      <div className="p-6 flex items-center justify-between titlebar-drag-region">
        {(isSidebarOpen || isMobile) ? (
          <div className="flex items-center space-x-3 animate-fade-in no-drag">
            <Logo />
            <div>
              <span className="text-xl font-bold tracking-tight text-white block leading-none">Skyc.ai</span>
              <span className="text-[10px] text-purple-300 font-medium tracking-widest uppercase">Enterprise Core</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto no-drag">
            <Logo />
          </div>
        )}
        {!isMobile && (
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white transition-colors no-drag">
            <Menu size={20} />
          </button>
        )}
        {isMobile && (
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white no-drag">
            <X size={24} />
          </button>
        )}
      </div>

      {/* Role Selector (Simulated Access Level) */}
      <div className={`px-4 py-6 ${( !isSidebarOpen && !isMobile ) && 'items-center flex flex-col'}`}>
        <div className="text-xs uppercase text-slate-500 font-semibold mb-2 px-2">
          {(isSidebarOpen || isMobile) ? 'Simulated Access' : 'Role'}
        </div>
        <div className="relative no-drag">
          <select 
            value={currentRole}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className={`w-full bg-slate-800 text-white text-sm rounded-lg border border-slate-700 p-2.5 focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer ${( !isSidebarOpen && !isMobile ) && 'w-12 text-transparent'}`}
          >
            {Object.values(UserRole).map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          {(isSidebarOpen || isMobile) && (
            <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto no-drag">
        {navItems.map((item) => (
          <button
            key={item.mode}
            onClick={() => {
              setViewMode(item.mode);
              if (isMobile) setIsMobileMenuOpen(false);
            }}
            className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 group ${
              viewMode === item.mode 
                ? 'bg-gradient-to-r from-purple-600 to-red-600 text-white shadow-lg shadow-purple-900/30' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            } ${( !isSidebarOpen && !isMobile ) && 'justify-center'}`}
          >
            <item.icon size={22} className={viewMode === item.mode ? 'animate-pulse' : ''} />
            {(isSidebarOpen || isMobile) && <span className="ml-3 font-medium">{item.label}</span>}
            
            {(isSidebarOpen || isMobile) && viewMode === item.mode && (
              <Zap size={14} className="ml-auto text-yellow-300 fill-yellow-300" />
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 titlebar-drag-region">
        <div className={`flex items-center ${( !isSidebarOpen && !isMobile ) && 'justify-center'}`}>
          <ShieldCheck size={20} className="text-emerald-400" />
          {(isSidebarOpen || isMobile) && (
            <div className="ml-3 animate-fade-in">
              <p className="text-xs font-medium text-slate-300">Swiss Secured</p>
              <p className="text-[10px] text-emerald-400">Entra ID Connected</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#faf5ff] overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside 
          className={`${
            isSidebarOpen ? 'w-64' : 'w-20'
          } bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-2xl z-30`}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <>
          <div 
            className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
              isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`} 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside 
            className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-50 transform transition-transform duration-300 shadow-2xl ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header - Made Draggable */}
        <header className="bg-white/80 backdrop-blur-md border-b border-purple-100 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 shadow-sm titlebar-drag-region">
          <div className="flex items-center no-drag">
            {isMobile && (
              <button 
                onClick={() => setIsMobileMenuOpen(true)} 
                className="mr-4 text-slate-600 hover:text-purple-600 p-1"
              >
                <Menu size={24} />
              </button>
            )}
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight">
                {viewMode === ViewMode.DASHBOARD && 'Operational Overview'}
                {viewMode === ViewMode.CHAT && 'Neural Agent Interface'}
                {viewMode === ViewMode.WHITEBOARD && 'Collaboration Canvas'}
                {viewMode === ViewMode.SETTINGS && 'Enterprise Settings'}
              </h1>
              {isMobile && <p className="text-[10px] text-purple-600 font-medium">Skyc.ai Mobile</p>}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 no-drag">
            
            {/* --- NEW INTEGRATION STATUS BAR --- */}
            <div className="hidden lg:flex items-center space-x-2 mr-4 bg-slate-50 border border-slate-200 rounded-lg p-1">
                <IntegrationStatus icon={Share2} active={true} color="text-teal-600" />
                <IntegrationStatus icon={MessageCircle} active={true} color="text-indigo-600" />
                <IntegrationStatus icon={Bug} active={false} color="text-blue-600" />
                <IntegrationStatus icon={Workflow} active={false} color="text-rose-600" />
                <IntegrationStatus icon={Video} active={false} color="text-blue-500" />
            </div>

            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-slate-900">{userData.name || 'Unknown User'}</div>
              <div className="text-[10px] text-slate-500 uppercase">{userData.username}</div>
            </div>

            <div 
                className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-purple-600 to-red-500 border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-105 transition-transform"
                title="Account Profile"
            >
              {getInitials(userData.name || 'User')}
            </div>

            <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                title="Sign Out"
            >
                <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content Area - REMOVED PADDING FOR FULL SCREEN SUPPORT */}
        <div className="flex-1 overflow-hidden relative bg-[#f8fafc]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;