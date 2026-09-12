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
  PlayCircle,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isOpenMobile, 
  onCloseMobile 
}) => {
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

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full w-full bg-[#121824] border-r border-[#26334D]">
      <div>
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-[#26334D] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 glow-blue flex-shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg text-white tracking-wide">VIGIL</h1>
              <p className="text-[10px] text-blue-400 uppercase tracking-widest font-mono">Voice Guard SOC</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button 
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#192233] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : item.highlight
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#192233]'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-amber-400' : 'text-gray-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-[#26334D] bg-[#0B0F17]/50 mt-auto">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">System Status</span>
          <span className="flex items-center text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            Operational
          </span>
        </div>
        <div className="text-[11px] text-gray-500 font-mono mt-1">SIH 2026 Prototype v1.0</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 z-30 flex-shrink-0">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Sliding Drawer Container */}
          <div className="relative flex-1 max-w-xs w-full h-full z-10 animate-in slide-in-from-left duration-300">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
