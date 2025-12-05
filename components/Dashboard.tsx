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
  LineChart,
  Line,
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
    { name: 'Week 1', score: 20 },
    { name: 'Week 2', score: 35 },
    { name: 'Week 3', score: 25 },
    { name: 'Week 4', score: 60 },
  ];

  const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        {trend === 'up' ? (
          <ArrowUpRight className="text-emerald-500 mr-1" size={16} />
        ) : (
          <ArrowDownRight className="text-rose-500 mr-1" size={16} />
        )}
        <span className={trend === 'up' ? 'text-emerald-500 font-medium' : 'text-rose-500 font-medium'}>
          {change}%
        </span>
        <span className="text-slate-400 ml-2">vs last month</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Emails Processed" 
          value="1.2M" 
          change={12.5} 
          icon={Mail} 
          trend="up" 
        />
        <StatCard 
          title="Risk Alerts" 
          value="24" 
          change={-5.2} 
          icon={AlertTriangle} 
          trend="down" 
        />
        <StatCard 
          title="Active Agents" 
          value="8" 
          change={0} 
          icon={Users} 
          trend="neutral" 
        />
        <StatCard 
          title="SLA Breaches Forecast" 
          value="3" 
          change={2.1} 
          icon={TrendingUp} 
          trend="down" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Email Volume Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Communication Volume</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emailData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="internal" fill="#0f172a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="external" fill="#E30613" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Analysis - Restricted for lower roles in a real app, simplified here */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Compliance Risk Trend</h3>
            {role === UserRole.CEO && (
              <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded font-bold">CEO VIEW</span>
            )}
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E30613" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#E30613" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#E30613" fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {role === UserRole.ANALYST && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Raw Data Ingestion Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Source</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Items</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white border-b">
                  <td className="px-6 py-4">2023-10-24 10:00</td>
                  <td className="px-6 py-4">Exchange Server EU</td>
                  <td className="px-6 py-4 text-emerald-600">Complete</td>
                  <td className="px-6 py-4">45,200</td>
                </tr>
                <tr className="bg-white border-b">
                  <td className="px-6 py-4">2023-10-24 10:05</td>
                  <td className="px-6 py-4">SharePoint Ops</td>
                  <td className="px-6 py-4 text-emerald-600">Complete</td>
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
