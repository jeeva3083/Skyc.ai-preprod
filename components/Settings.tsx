import React, { useState } from 'react';
import { Database, Upload, RefreshCw, CheckCircle, AlertCircle, Mail, Loader2, Workflow, Bug, Share2, MessageCircle, Video, Server, ShieldCheck } from 'lucide-react';
import { useMsal } from "@azure/msal-react";
import { fetchOutlookEmails } from '../services/graph';

const Settings = () => {
  const { instance, accounts } = useMsal();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [emailCount, setEmailCount] = useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Not synced yet");

  // Mock states for new integrations
  const [integrations, setIntegrations] = useState({
      jira: false,
      servicenow: false,
      sharepoint: true, // Auto-connected via Entra
      teams: true, // Auto-connected
      zoom: false
  });

  const toggleIntegration = (key: keyof typeof integrations) => {
      setIntegrations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOutlookSync = async () => {
    if (accounts.length === 0) {
        setSyncStatus('error');
        return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');

    try {
        const emails = await fetchOutlookEmails(instance as any, accounts[0]);
        setEmailCount(emails.length);
        setLastSyncTime(new Date().toLocaleTimeString());
        setSyncStatus('success');
        console.log("Synced Emails:", emails);
    } catch (e) {
        console.error("Sync failed", e);
        setSyncStatus('error');
    } finally {
        setIsSyncing(false);
    }
  };

  const IntegrationCard = ({ icon: Icon, name, desc, connected, onToggle, color }: any) => (
    <div className={`flex items-center justify-between p-4 border rounded-lg transition-all ${connected ? 'bg-white border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-80'}`}>
        <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-lg ${connected ? color : 'bg-slate-200 text-slate-500'}`}>
                <Icon size={24} />
            </div>
            <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    {name}
                    {connected && <CheckCircle size={14} className="text-emerald-500" />}
                </h3>
                <p className="text-sm text-slate-500">{desc}</p>
            </div>
        </div>
        <button 
            onClick={onToggle}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                connected 
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
        >
            {connected ? 'Disconnect' : 'Connect'}
        </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in p-8 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Enterprise Gateway</h2>
            <p className="text-slate-500">Manage data sources, API connectors, and secure extensions.</p>
          </div>
          <div className="flex gap-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center">
                  <ShieldCheck size={12} className="mr-1"/> SOC2 Compliant
              </span>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Column 1: Core Data & Identity */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center"><Server size={18} className="mr-2 text-purple-600"/> Data Ingestion</h3>
                <div className="space-y-3">
                    {/* Outlook */}
                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Mail size={20} /></div>
                            <div>
                                <h4 className="font-medium text-sm text-slate-900">Microsoft Outlook</h4>
                                <p className="text-xs text-slate-500">{syncStatus === 'success' ? `Last sync: ${lastSyncTime}` : 'Mail & Calendar Scope'}</p>
                            </div>
                        </div>
                        <button onClick={handleOutlookSync} disabled={isSyncing} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors">
                            {isSyncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                        </button>
                    </div>

                    {/* SharePoint */}
                    <IntegrationCard 
                        icon={Share2} 
                        name="SharePoint" 
                        desc="Knowledge Base Indexing" 
                        connected={integrations.sharepoint} 
                        onToggle={() => toggleIntegration('sharepoint')}
                        color="bg-teal-100 text-teal-600"
                    />
                    
                    {/* SQL (Mock) */}
                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg opacity-50 cursor-not-allowed bg-slate-50">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-slate-200 text-slate-500 rounded-lg"><Database size={20} /></div>
                            <div>
                                <h4 className="font-medium text-sm text-slate-900">SQL Data Lake</h4>
                                <p className="text-xs text-slate-500">Requires VPN Tunnel</p>
                            </div>
                        </div>
                        <button className="text-xs text-slate-400 font-medium px-2">Unavailable</button>
                    </div>
                </div>
            </div>

             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center"><ShieldCheck size={18} className="mr-2 text-emerald-600"/> Security & Compliance</h3>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <CheckCircle className="text-emerald-600" size={20} />
                        <div>
                            <h4 className="text-sm font-bold text-emerald-900">Azure Entra ID Active</h4>
                            <p className="text-xs text-emerald-700">Session encrypted. Token rotation enabled.</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* Column 2: External Services */}
          <div className="space-y-6">
             
             {/* Service Management */}
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center"><Workflow size={18} className="mr-2 text-orange-600"/> Service Management</h3>
                <div className="space-y-3">
                    <IntegrationCard 
                        icon={Workflow} 
                        name="ServiceNow" 
                        desc="Incident & Change Mgmt" 
                        connected={integrations.servicenow} 
                        onToggle={() => toggleIntegration('servicenow')}
                        color="bg-rose-100 text-rose-600"
                    />
                     <IntegrationCard 
                        icon={Bug} 
                        name="JIRA Software" 
                        desc="Issue Tracking & Agile" 
                        connected={integrations.jira} 
                        onToggle={() => toggleIntegration('jira')}
                        color="bg-blue-100 text-blue-600"
                    />
                </div>
             </div>

             {/* Communication */}
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center"><MessageCircle size={18} className="mr-2 text-indigo-600"/> Collaboration</h3>
                <div className="space-y-3">
                    <IntegrationCard 
                        icon={MessageCircle} 
                        name="Microsoft Teams" 
                        desc="Chat Ops & Status" 
                        connected={integrations.teams} 
                        onToggle={() => toggleIntegration('teams')}
                        color="bg-indigo-100 text-indigo-600"
                    />
                     <IntegrationCard 
                        icon={Video} 
                        name="Zoom" 
                        desc="Conference Intelligence" 
                        connected={integrations.zoom} 
                        onToggle={() => toggleIntegration('zoom')}
                        color="bg-blue-100 text-blue-500"
                    />
                </div>
             </div>

          </div>
      </div>
    </div>
  );
};

export default Settings;