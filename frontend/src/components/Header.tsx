'use client';

import React from 'react';
import {
  Bell,
  Wifi,
  LogOut,
  Menu,
} from 'lucide-react';

interface HeaderProps {
  title: string;
  user: {
    username: string;
    role: string;
  } | null;
  onLogout: () => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  user,
  onLogout,
  onToggleMobileSidebar,
}) => {
  const userInitials = user?.username
    ? user.username.substring(0, 2).toUpperCase()
    : 'US';

  return (
    <header className="sticky top-0 z-30 w-full h-14 sm:h-16 bg-[#121824] border-b border-[#26334D]">
      <div className="h-full px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-3">

        {/* LEFT */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">

          {/* Mobile menu */}
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            aria-label="Open navigation menu"
            className="
              lg:hidden
              flex-shrink-0
              p-2
              rounded-lg
              text-gray-400
              hover:text-white
              hover:bg-[#192233]
              transition-colors
            "
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-white tracking-wide truncate">
              {title}
            </h2>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

          {/* WebSocket status */}
          <div className="
            flex items-center gap-1.5
            bg-[#192233]
            border border-[#26334D]
            rounded-full
            px-2 sm:px-3
            py-1.5
          ">
            <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />

            <span className="hidden sm:inline text-[10px] sm:text-xs text-gray-300 font-mono">
              WebSocket: Live
            </span>

            <span className="sm:hidden text-[9px] text-emerald-400 font-mono">
              LIVE
            </span>
          </div>

          {/* Notification */}
          <button
            type="button"
            aria-label="Notifications"
            className="
              relative
              p-1.5 sm:p-2
              rounded-lg
              text-gray-400
              hover:text-white
              hover:bg-[#192233]
              transition-colors
            "
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />

            <span className="
              absolute
              top-1
              right-1
              w-2
              h-2
              rounded-full
              bg-red-500
            " />
          </button>

          {/* User */}
          <div className="
            flex items-center
            gap-2 sm:gap-3
            border-l
            border-[#26334D]
            pl-2 sm:pl-4
          ">

            {/* Avatar */}
            <div className="
              w-7 h-7
              sm:w-8 sm:h-8
              rounded-full
              bg-blue-600/30
              border border-blue-500/50
              flex items-center justify-center
              text-blue-400
              font-bold
              text-[10px] sm:text-xs
              flex-shrink-0
            ">
              {userInitials}
            </div>

            {/* User details - desktop only */}
            <div className="hidden md:block min-w-0">
              <div className="text-xs font-semibold text-white truncate max-w-[120px]">
                {user?.username || 'Authenticated User'}
              </div>

              <div className="text-[9px] text-gray-500 uppercase font-mono">
                {user?.role || 'ANALYST'} ROLE
              </div>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              title="Log Out"
              aria-label="Log Out"
              className="
                p-1.5
                rounded-lg
                text-gray-400
                hover:text-red-400
                hover:bg-red-500/10
                transition-colors
              "
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
