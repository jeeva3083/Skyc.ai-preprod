import React from 'react';
import { UserRole } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  Mail, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Phone, 
  CheckSquare, 
  MoreHorizontal,
  Star,
  Clock,
  Video,
  Workflow,
  Bug,
  MessageCircle
} from 'lucide-react';

interface DashboardProps {
  role: UserRole;
}

const Dashboard: React.FC<DashboardProps> = ({ role }) => {
  // Mock Data for Charts
  const emailData = [
    { name: 'Mon', internal: 4000, external: 2400 },
    { name: 'Tue', internal: 3000, external: 1398 },
    { name: 'Wed', internal: 2000, external: 9800 },
    { name: 'Thu', internal: 2780, external: 3908 },
    { name: 'Fri', internal: 1890, external: 4800 },
  ];

  const riskData = [
    { name: 'W1', score: 20 },
    { name: 'W2', score: 35 },
    { name: 'W3', score: 25 },
    { name: 'W4', score: 60 },
  ];

  // --- MOCK DATA FOR NEW WIDGETS ---
  const keyEmails = [
    { id: 1, from: 'Sarah Connor', subject: 'Urgent: Security Protocol Update', time: '10m ago', important: true, avatar: 'SC' },
    { id: 2, from: 'Director Fury', subject: 'Budget Approval Required for Q4', time: '1h ago', important: true, avatar: 'DF' },
    { id: 3, from: 'Legal Team', subject: 'Contract Revision v2', time: '2h ago', important: false, avatar: 'LT' },
    { id: 4, from: 'IT Support', subject: 'Scheduled Maintenance', time: '4h ago', important: false, avatar: 'IT' },
  ];

  const upcomingMeetings = [
    { id: 1, title: 'Q3 Board Review', time: '10:00 AM', duration: '1h', attendees: 4, type: 'video' },
    { id: 2, title: 'Project Falcon Sync', time: '02:00 PM', duration: '30m', attendees: 6, type: 'person' },
    { id: 3, title: 'Client Onboarding', time: '04:30 PM', duration: '45m', attendees: 2, type: 'video' },
  ];

  const callList = [
    { id: 1, name: 'Dr. Emily Smith', role: 'Lead Researcher', status: 'online', avatar: 'ES' },
    { id: 2, name: 'Agent K', role: 'Security Ops', status: 'busy', avatar: 'AK' },
    { id: 3, name: 'Support Desk', role: 'Global Ops', status: 'offline', avatar: 'SD' },
  ];

  const aiFollowUps = [
    { id: 1, task: 'Review Q3 Financial Discrepancies', status: 'pending', priority: 'high' },
    { id: 2, task: 'Schedule follow-up with Cyberdyne', status: 'pending', priority: 'medium' },
    { id: 3, task: 'Approve new hiring requisitions', status: 'done', priority: 'low' },
  ];

  const serviceTickets = [
      { id: 'INC00124', title: 'VPN Latency in EU Region', sys: 'ServiceNow', type: 'incident', status: 'Critical' },
      { id: 'KAN-452', title: 'Mobile App Login Crash', sys: 'JIRA', type: 'bug', status: 'In Progress' },
      { id: 'INC00129', title: 'Outlook Sync Failure', sys: 'ServiceNow', type: 'incident', status: 'New' },
  ];

  const StatCard = ({ title, value, change, icon: Icon, trend, color }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-2 group-hover:text-purple-700 transition-colors">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-4 flex items-center text-xs font-medium">
        {trend === 'up' ? (
          <ArrowUpRight className="text-emerald-500 mr-1" size={14} />
        ) : trend === 'down' ? (
          <ArrowDownRight className="text-rose-500 mr-1" size={14} />
        ) : (
          <span className="w-3.5 mr-1">-</span>
        )}
        <span className={trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-500'}>
          {Math.abs(change)}%
        </span>
        <span className="text-slate-400 ml-2">vs last week</span>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 animate-fade-in bg-[#f8fafc]">
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Emails Processed" value="1.2M" change={12.5} icon={Mail} trend="up" color="bg-blue-50 text-blue-600"/>
        <StatCard title="Risk Alerts" value="24" change={-5.2} icon={AlertTriangle} trend="down" color="bg-rose-50 text-rose-600"/>
        <StatCard title="Active Agents" value="8" change={0} icon={Users} trend="neutral" color="bg-purple-50 text-purple-600"/>
        <StatCard title="SLA Breaches" value="3" change={2.1} icon={TrendingUp} trend="down" color="bg-amber-50 text-amber-600"/>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Email Volume Chart (2 cols) */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-purple-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-800 flex items-center">
                <span className="w-2 h-2 rounded-full bg-slate-900 mr-2"></span>
                Communication Volume
            </h3>
            <button className="text-slate-400 hover:text-purple-600"><MoreHorizontal size={20}/></button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emailData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e9d5ff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="internal" fill="#475569" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="external" fill="#9333ea" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Trend (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm relative overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-base font-bold text-slate-800 flex items-center">
              <span className="w-2 h-2 rounded-full bg-[#E30613] mr-2 animate-pulse"></span>
              Risk Trend
            </h3>
            {role === UserRole.CEO && (
              <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-1 rounded-full border border-rose-100 font-bold tracking-wide">CEO</span>
            )}
          </div>
          <div className="flex-1 min-h-[200px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E30613" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#E30613" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #fee2e2' }} />
                <Area type="monotone" dataKey="score" stroke="#E30613" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- NEW WIDGETS ROW --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* WIDGET 1: KEY EMAILS */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm flex flex-col h-96">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h4 className="font-bold text-slate-800 flex items-center text-sm">
                    <Mail size={16} className="mr-2 text-blue-500" /> Key Emails
                </h4>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">4 New</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {keyEmails.map(email => (
                    <div key={email.id} className="p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group border border-transparent hover:border-slate-100">
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-[10px] flex items-center justify-center font-bold text-slate-600">
                                    {email.avatar}
                                </div>
                                <span className="text-xs font-semibold text-slate-700">{email.from}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{email.time}</span>
                        </div>
                        <p className="text-sm text-slate-800 font-medium leading-tight line-clamp-2">{email.subject}</p>
                        <div className="mt-2 flex space-x-2">
                            {email.important && <span className="text-[10px] flex items-center text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded"><Star size={8} className="mr-1 fill-amber-600"/> Priority</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* WIDGET 2: SERVICE HEALTH & TICKETS (JIRA/ServiceNow) */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm flex flex-col h-96">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h4 className="font-bold text-slate-800 flex items-center text-sm">
                    <Workflow size={16} className="mr-2 text-rose-500" /> Ops & Service
                </h4>
                <span className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {serviceTickets.map(ticket => (
                    <div key={ticket.id} className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between mb-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${ticket.sys === 'ServiceNow' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>{ticket.sys}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{ticket.id}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">{ticket.title}</p>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-slate-500">{ticket.type}</span>
                            <span className={`text-[10px] font-medium ${ticket.status === 'Critical' ? 'text-red-500' : 'text-slate-600'}`}>{ticket.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* WIDGET 3: CALL PEOPLE (Updated with Teams/Zoom) */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm flex flex-col h-96">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h4 className="font-bold text-slate-800 flex items-center text-sm">
                    <Phone size={16} className="mr-2 text-emerald-500" /> Quick Dial
                </h4>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {callList.map(person => (
                    <div key={person.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                                    {person.avatar}
                                </div>
                                <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${person.status === 'online' ? 'bg-emerald-500' : person.status === 'busy' ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{person.name}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wide">{person.role}</p>
                            </div>
                        </div>
                        <div className="flex space-x-1">
                            <button className="p-2 bg-indigo-50 text-indigo-500 rounded-full hover:bg-indigo-500 hover:text-white transition-all shadow-sm" title="Teams Chat">
                                <MessageCircle size={14} />
                            </button>
                            <button className="p-2 bg-blue-50 text-blue-500 rounded-full hover:bg-blue-500 hover:text-white transition-all shadow-sm" title="Zoom Call">
                                <Video size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* WIDGET 4: AI FOLLOW UPS */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg flex flex-col h-96 text-white relative overflow-hidden">
             {/* Background glow */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 blur-3xl rounded-full pointer-events-none"></div>
             
             <div className="p-4 border-b border-white/10 flex justify-between items-center relative z-10">
                <h4 className="font-bold flex items-center text-sm">
                    <CheckSquare size={16} className="mr-2 text-purple-400" /> AI Follow-Up
                </h4>
                <div className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">Auto-Generated</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10">
                {aiFollowUps.map(item => (
                    <div key={item.id} className="flex items-start space-x-3 group">
                        <div className={`mt-1 w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${item.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-purple-400'}`}>
                             {item.status === 'done' && <CheckSquare size={10} className="text-white" />}
                        </div>
                        <div className={`flex-1 text-sm ${item.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                            {item.task}
                            <div className="mt-1 flex gap-2">
                                {item.priority === 'high' && <span className="text-[9px] text-rose-400 bg-rose-900/20 px-1.5 rounded">High Priority</span>}
                                {item.priority === 'medium' && <span className="text-[9px] text-amber-400 bg-amber-900/20 px-1.5 rounded">Medium</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* AI Footer Input */}
            <div className="p-3 bg-white/5 border-t border-white/10 relative z-10">
                <input type="text" placeholder="Add task for AI..." className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none" />
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;