'use client';

import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  UploadCloud, 
  UserCheck, 
  ShieldCheck, 
  History, 
  Bell, 
  BarChart3, 
  Settings, 
  PlayCircle 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'live-monitor', label: 'Live Monitor', icon: ShieldAlert },
    { id: 'analyze', label: 'Analyze Audio', icon: UploadCloud },
    { id: 'speaker-verify', label: 'Speaker Verification', icon: UserCheck },
    { id: 'threat-intel', label: 'Threat Intelligence', icon: ShieldCheck },
    { id: 'sessions', label: 'Sessions', icon: History },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'demo-mode', label: 'SIH Demo Mode', icon: PlayCircle, highlight: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#121824] border-r border-[#26334D] flex flex-col justify-between h-screen sticky top-0 z-30">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#26334D] flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 glow-blue">
            <ShieldAlert className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-wide">VIGIL</h1>
            <p className="text-[10px] text-blue-400 uppercase tracking-widest font-mono">Voice Guard SOC</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : item.highlight
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#192233]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-amber-400' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-[#26334D] bg-[#0B0F17]/50">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">System Status</span>
          <span className="flex items-center text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            Operational
          </span>
        </div>
        <div className="text-[11px] text-gray-500 font-mono mt-1">SIH 2026 Prototype v1.0</div>
      </div>
    </aside>
  );
};
