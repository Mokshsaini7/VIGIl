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
  X,
  Menu,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const menuItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Activity,
  },
  {
    id: 'live-monitor',
    label: 'Live Monitor',
    icon: ShieldAlert,
  },
  {
    id: 'analyze',
    label: 'Analyze Audio',
    icon: UploadCloud,
  },
  {
    id: 'speaker-verify',
    label: 'Speaker Verification',
    icon: UserCheck,
  },
  {
    id: 'threat-intel',
    label: 'Threat Intelligence',
    icon: ShieldCheck,
  },
  {
    id: 'sessions',
    label: 'Sessions',
    icon: History,
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: Bell,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
  },
  {
    id: 'demo-mode',
    label: 'Demo Mode',
    icon: PlayCircle,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const handleNavigation = (id: string) => {
    setActiveTab(id);
    onCloseMobile();
  };

  return (
    <aside
      className={`
        fixed lg:relative
        inset-y-0 left-0
        z-[60]
        w-[280px] lg:w-64
        max-w-[85vw]
        h-screen
        flex flex-col
        bg-[#0F1623]
        border-r border-[#26334D]
        shadow-2xl lg:shadow-none

        transform
        transition-transform
        duration-300
        ease-in-out

        ${
          isOpenMobile
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }
      `}
    >
      {/* Logo */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-[#26334D] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>

          <div className="min-w-0">
            <div className="text-white font-bold tracking-wider text-lg">
              VIGIL
            </div>
            <div className="text-[9px] text-gray-500 font-mono tracking-wider truncate">
              VOICE SECURITY
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#192233] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigation(item.id)}
                className={`
                  group
                  w-full
                  flex
                  items-center
                  gap-3
                  px-3
                  py-2.5
                  rounded-lg
                  text-left
                  transition-all
                  duration-200

                  ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-[#192233] border border-transparent'
                  }
                `}
              >
                <Icon
                  className={`
                    w-4.5 h-4.5 flex-shrink-0
                    ${
                      isActive
                        ? 'text-blue-400'
                        : 'text-gray-500 group-hover:text-gray-300'
                    }
                  `}
                />

                <span className="text-sm font-medium truncate">
                  {item.label}
                </span>

                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom Status */}
      <div className="p-3 border-t border-[#26334D] flex-shrink-0">
        <div className="rounded-lg bg-[#121824] border border-[#26334D] p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>

            <span className="text-xs text-emerald-400 font-medium">
              System Online
            </span>
          </div>

          <div className="text-[10px] text-gray-500 font-mono">
            VIGIL SECURITY ENGINE
          </div>
        </div>
      </div>
    </aside>
  );
};
