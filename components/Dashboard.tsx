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
import { TrendingUp, AlertTriangle, Mail, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardProps {
  role: UserRole;
}

const Dashboard: React.FC<DashboardProps> = ({ role }) => {
  // Mock Data
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
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Metrics Grid - Responsive columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Emails Processed" 
          value="1.2M" 
          change={12.5} 
          icon={Mail} 
          trend="up" 
          color="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="Risk Alerts" 
          value="24" 
          change={-5.2} 
          icon={AlertTriangle} 
          trend="down" 
          color="bg-rose-50 text-rose-600"
        />
        <StatCard 
          title="Active Agents" 
          value="8" 
          change={0} 
          icon={Users} 
          trend="neutral" 
          color="bg-purple-50 text-purple-600"
        />
        <StatCard 
          title="SLA Breaches" 
          value="3" 
          change={2.1} 
          icon={TrendingUp} 
          trend="down" 
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Email Volume Chart */}
        <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center">
            <span className="w-2 h-2 rounded-full bg-slate-900 mr-2"></span>
            Communication Volume
          </h3>
          <div className="h-64 sm:h-80">
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

        {/* Risk Analysis */}
        <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-base font-bold text-slate-800 flex items-center">
              <span className="w-2 h-2 rounded-full bg-[#E30613] mr-2 animate-pulse"></span>
              Compliance Risk Trend
            </h3>
            {role === UserRole.CEO && (
              <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-1 rounded-full border border-rose-100 font-bold tracking-wide">CEO VIEW</span>
            )}
          </div>
          <div className="h-64 sm:h-80 relative z-10">
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
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #fee2e2' }}
                />
                <Area type="monotone" dataKey="score" stroke="#E30613" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full opacity-50 z-0"></div>
        </div>
      </div>

      {role === UserRole.ANALYST && (
        <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4">Raw Data Ingestion Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-3 rounded-l-lg">Timestamp</th>
                  <th className="px-6 py-3">Source</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 rounded-r-lg">Items</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white border-b hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">2023-10-24 10:00</td>
                  <td className="px-6 py-4 font-medium text-slate-800">Exchange Server EU</td>
                  <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs">Complete</span></td>
                  <td className="px-6 py-4">45,200</td>
                </tr>
                <tr className="bg-white border-b hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">2023-10-24 10:05</td>
                  <td className="px-6 py-4 font-medium text-slate-800">SharePoint Ops</td>
                  <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs">Complete</span></td>
                  <td className="px-6 py-4">1,200</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;