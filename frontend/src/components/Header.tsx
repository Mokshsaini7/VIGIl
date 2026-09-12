'use client';

import React from 'react';
import { Bell, Wifi, LogOut, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  user: { username: string; role: string } | null;
  onLogout: () => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  user, 
  onLogout,
  onToggleMobileSidebar
}) => {
  const userInitials = user?.username ? user.username.substring(0, 2).toUpperCase() : 'US';

  return (
    <header className="h-14 sm:h-16 bg-[#121824] border-b border-[#26334D] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 w-full min-w-0">
      {/* Left Title & Mobile Menu Trigger */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#192233] transition-colors flex-shrink-0"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-sm sm:text-lg font-semibold text-white tracking-wide truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
          {title}
        </h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
        {/* Connection status indicator */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 bg-[#192233] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-[#26334D]">
          <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-[10px] sm:text-xs text-gray-300 font-mono hidden sm:inline">WebSocket: Live</span>
        </div>

        {/* Notifications */}
        <button className="relative p-1.5 sm:p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#192233] transition-colors">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
        </button>

        {/* User Profile & Logout */}
        <div className="flex items-center space-x-2 sm:space-x-3 border-l border-[#26334D] pl-2 sm:pl-4">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold text-xs flex-shrink-0">
            {userInitials}
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-semibold text-white truncate max-w-[120px]">{user?.username || 'Authenticated User'}</div>
            <div className="text-[10px] text-gray-400 uppercase font-mono">{user?.role || 'ANALYST'} ROLE</div>
          </div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            aria-label="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
