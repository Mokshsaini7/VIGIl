'use client';

import React from 'react';
import {
  Bell,
  Wifi,
  LogOut,
  Menu,
} from 'lucide-react';

import LogoView from '../app/components/LogoView';

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
      <div className="h-full px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-2 sm:gap-4">

        {/* ===================================================== */}
        {/* LEFT SIDE */}
        {/* ===================================================== */}

        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">

          {/* Mobile Menu */}
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            aria-label="Open navigation menu"
            className="
              lg:hidden
              flex-shrink-0
              w-9 h-9
              flex items-center justify-center
              rounded-lg
              text-gray-400
              hover:text-white
              hover:bg-[#192233]
              active:bg-[#26334D]
              transition-colors
            "
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* VIGIL Logo */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <LogoView
              size={32}
              className="sm:hidden"
            />

            <LogoView
              size={38}
              className="hidden sm:flex"
            />

            {/* Brand - hidden on very small screens */}
            <div className="hidden sm:block leading-none">
              <div className="text-sm font-bold tracking-wider text-white">
                VIGIL
              </div>

              <div className="text-[8px] text-gray-500 uppercase tracking-widest mt-1">
                Voice Security
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-7 w-px bg-[#26334D]" />

          {/* Page Title */}
          <div className="min-w-0 flex-1">
            <h2 className="
              text-xs
              sm:text-sm
              lg:text-lg
              font-semibold
              text-white
              tracking-wide
              truncate
            ">
              {title}
            </h2>
          </div>
        </div>

        {/* ===================================================== */}
        {/* RIGHT SIDE */}
        {/* ===================================================== */}

        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">

          {/* ================================================= */}
          {/* WEBSOCKET STATUS */}
          {/* ================================================= */}

          <div className="
            flex items-center
            gap-1.5
            bg-[#192233]
            border border-[#26334D]
            rounded-full
            px-2
            sm:px-3
            py-1.5
            whitespace-nowrap
          ">

            <span className="relative flex h-2 w-2">
              <span className="
                animate-ping
                absolute
                inline-flex
                h-full
                w-full
                rounded-full
                bg-emerald-400
                opacity-75
              " />

              <span className="
                relative
                inline-flex
                rounded-full
                h-2
                w-2
                bg-emerald-400
              " />
            </span>

            <Wifi className="
              hidden
              sm:block
              w-3.5
              h-3.5
              text-emerald-400
            " />

            <span className="
              hidden
              sm:inline
              text-[10px]
              lg:text-xs
              text-gray-300
              font-mono
            ">
              WebSocket: Live
            </span>

            <span className="
              sm:hidden
              text-[9px]
              text-emerald-400
              font-mono
              font-bold
            ">
              LIVE
            </span>
          </div>

          {/* ================================================= */}
          {/* NOTIFICATIONS */}
          {/* ================================================= */}

          <button
            type="button"
            aria-label="Notifications"
            className="
              relative
              w-9 h-9
              sm:w-10 sm:h-10
              flex items-center justify-center
              rounded-lg
              text-gray-400
              hover:text-white
              hover:bg-[#192233]
              active:bg-[#26334D]
              transition-colors
              flex-shrink-0
            "
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />

            {/* Notification Dot */}
            <span className="
              absolute
              top-1.5
              right-1.5
              sm:top-2
              sm:right-2
              w-1.5
              h-1.5
              sm:w-2
              sm:h-2
              rounded-full
              bg-red-500
              ring-2
              ring-[#121824]
            " />
          </button>

          {/* ================================================= */}
          {/* USER SECTION */}
          {/* ================================================= */}

          <div className="
            flex items-center
            gap-1.5
            sm:gap-3
            border-l
            border-[#26334D]
            pl-1.5
            sm:pl-3
            lg:pl-4
          ">

            {/* Avatar */}
            <div className="
              w-7 h-7
              sm:w-8 sm:h-8
              lg:w-9 lg:h-9
              rounded-full
              bg-blue-600/20
              border border-blue-500/50
              flex items-center justify-center
              text-blue-400
              font-bold
              text-[9px]
              sm:text-xs
              flex-shrink-0
            ">
              {userInitials}
            </div>

            {/* User Details */}
            <div className="
              hidden
              md:block
              min-w-0
            ">
              <div className="
                text-xs
                font-semibold
                text-white
                truncate
                max-w-[120px]
                lg:max-w-[160px]
              ">
                {user?.username || 'Authenticated User'}
              </div>

              <div className="
                text-[8px]
                lg:text-[9px]
                text-gray-500
                uppercase
                font-mono
                mt-0.5
              ">
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
                w-8 h-8
                sm:w-9 sm:h-9
                flex items-center justify-center
                rounded-lg
                text-gray-400
                hover:text-red-400
                hover:bg-red-500/10
                active:bg-red-500/20
                transition-colors
                flex-shrink-0
              "
            >
              <LogOut className="w-4 h-4 sm:w-[17px] sm:h-[17px]" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
