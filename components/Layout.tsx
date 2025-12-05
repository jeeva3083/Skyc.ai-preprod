import React from 'react';
import { ViewMode, UserRole } from '../types';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Trello, 
  Settings, 
  ShieldCheck, 
  LogOut,
  Menu,
  ChevronDown
} from 'lucide-react';

interface LayoutProps {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentRole, setRole, viewMode, setViewMode, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const navItems = [
    { mode: ViewMode.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
    { mode: ViewMode.CHAT, icon: MessageSquare, label: 'AI Agents' },
    { mode: ViewMode.WHITEBOARD, icon: Trello, label: 'Workspace' },
    { mode: ViewMode.SETTINGS, icon: Settings, label: 'Settings & Data' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl z-20`}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#E30613] rounded-md flex items-center justify-center font-bold text-white">S</div>
              <span className="text-xl font-bold tracking-tight">Skyc.ai</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-[#E30613] rounded-md flex items-center justify-center font-bold text-white mx-auto">S</div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white">
            <Menu size={20} />
          </button>
        </div>

        {/* User / Role Selector */}
        <div className={`px-4 py-6 ${!isSidebarOpen && 'items-center flex flex-col'}`}>
          <div className="text-xs uppercase text-slate-500 font-semibold mb-2 px-2">
            {isSidebarOpen ? 'Current Role' : 'Role'}
          </div>
          <div className="relative">
            <select 
              value={currentRole}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className={`w-full bg-slate-800 text-white text-sm rounded-lg border border-slate-700 p-2.5 focus:ring-[#E30613] focus:border-[#E30613] appearance-none cursor-pointer ${!isSidebarOpen && 'w-12 text-transparent'}`}
            >
              {Object.values(UserRole).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            {isSidebarOpen && (
              <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.mode}
              onClick={() => setViewMode(item.mode)}
              className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                viewMode === item.mode 
                  ? 'bg-[#E30613] text-white shadow-lg shadow-red-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              } ${!isSidebarOpen && 'justify-center'}`}
            >
              <item.icon size={22} />
              {isSidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className={`flex items-center ${!isSidebarOpen && 'justify-center'}`}>
            <ShieldCheck size={20} className="text-emerald-500" />
            {isSidebarOpen && (
              <div className="ml-3">
                <p className="text-xs font-medium text-slate-300">Swiss Hosted</p>
                <p className="text-[10px] text-emerald-500">Secure & Encrypted</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-slate-800">
            {viewMode === ViewMode.DASHBOARD && 'Operational Overview'}
            {viewMode === ViewMode.CHAT && 'Agent Workspace'}
            {viewMode === ViewMode.WHITEBOARD && 'Collaboration Canvas'}
            {viewMode === ViewMode.SETTINGS && 'Enterprise Settings'}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {currentRole} View Active
            </span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border-2 border-white shadow-sm flex items-center justify-center text-white text-xs">
              KJ
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
