import React from 'react';
import { Database, Upload, RefreshCw, CheckCircle } from 'lucide-react';

const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Data Ingestion Sources</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Database size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Microsoft Outlook</h3>
                <p className="text-sm text-slate-500">Connected to 15 inboxes. Last sync: 2 mins ago.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="flex items-center text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">
                <CheckCircle size={12} className="mr-1" /> Active
              </span>
              <button className="p-2 text-slate-400 hover:text-slate-600">
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <Database size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Zendesk Tickets</h3>
                <p className="text-sm text-slate-500">Processing 4,500 tickets for sentiment analysis.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="flex items-center text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">
                <CheckCircle size={12} className="mr-1" /> Active
              </span>
              <button className="p-2 text-slate-400 hover:text-slate-600">
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-4">Manual Ingestion</h3>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="mx-auto w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <Upload size={24} />
            </div>
            <p className="text-slate-600 font-medium">Click to upload documents</p>
            <p className="text-xs text-slate-400 mt-1">PDF, DOCX, CSV supported (Max 50MB)</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Enterprise Branding</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
            <input type="text" value="Skyc.ai Client A" className="w-full p-2 border border-slate-300 rounded-lg text-sm" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Theme Color</label>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-[#E30613]"></div>
              <input type="text" value="#E30613" className="w-full p-2 border border-slate-300 rounded-lg text-sm" readOnly />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
