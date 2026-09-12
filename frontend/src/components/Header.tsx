'use client';

import React from 'react';
import { Bell, Wifi, LogOut } from 'lucide-react';

interface HeaderProps {
  title: string;
  user: { username: string; role: string } | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, user, onLogout }) => {
  const userInitials = user?.username ? user.username.substring(0, 2).toUpperCase() : 'US';

  return (
    <header className="h-16 bg-[#121824] border-b border-[#26334D] px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-semibold text-white tracking-wide">{title}</h2>
      </div>

      <div className="flex items-center space-x-5">
        {/* Connection status indicator */}
        <div className="flex items-center space-x-2 bg-[#192233] px-3 py-1.5 rounded-full border border-[#26334D]">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-gray-300 font-mono">WebSocket: Live</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#192233] transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
        </button>

        {/* User Profile & Logout */}
        <div className="flex items-center space-x-3 border-l border-[#26334D] pl-5">
          <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold text-xs">
            {userInitials}
          </div>
          <div>
            <div className="text-xs font-semibold text-white">{user?.username || 'Authenticated User'}</div>
            <div className="text-[10px] text-gray-400 uppercase font-mono">{user?.role || 'ANALYST'} ROLE</div>
          </div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-2"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
