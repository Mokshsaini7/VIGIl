'use client';

import React, { useEffect, useState } from 'react';

import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

import { OverviewView } from '@/components/OverviewView';
import { LiveMonitorView } from '@/components/LiveMonitorView';
import { AnalyzeView } from '@/components/AnalyzeView';
import { SpeakerVerificationView } from '@/components/SpeakerVerificationView';
import { ThreatIntelView } from '@/components/ThreatIntelView';
import { AlertsView } from '@/components/AlertsView';
import { SessionsView } from '@/components/SessionsView';
import { DemoModeView } from '@/components/DemoModeView';

import { LoginView } from '@/components/LoginView';
import { SignupView } from '@/components/SignupView';

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');

  const [authUser, setAuthUser] = useState<{
    username: string;
    role: string;
    token: string;
  } | null>(null);

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const [initialized, setInitialized] = useState(false);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Restore saved authentication session
  useEffect(() => {
    try {
      const token = localStorage.getItem('vigil_token');
      const userStr = localStorage.getItem('vigil_user');

      if (token && userStr) {
        const userObj = JSON.parse(userStr);

        setAuthUser({
          username: userObj.username,
          role: userObj.role,
          token,
        });
      }
    } catch (error) {
      console.error('Failed to restore VIGIL session:', error);
    }

    setInitialized(true);
  }, []);

  // Change active tab
  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('vigil_token');
    localStorage.removeItem('vigil_user');

    setAuthUser(null);
    setAuthMode('login');
    setIsMobileSidebarOpen(false);
  };

  // Login / signup success
  const handleAuthSuccess = (user: {
    username: string;
    role: string;
    token: string;
  }) => {
    setAuthUser(user);
    setActiveTab('overview');
    setIsMobileSidebarOpen(false);
  };

  // Loading state
  if (!initialized) {
    return (
      <div className="min-h-screen w-full bg-[#0B0F17] flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-xl font-bold text-white mb-2">
            VIGIL
          </div>

          <div className="text-sm text-gray-500">
            Initializing Voice Security Center...
          </div>
        </div>
      </div>
    );
  }

  // Authentication
  if (!authUser) {
    if (authMode === 'login') {
      return (
        <LoginView
          onLoginSuccess={handleAuthSuccess}
          onSwitchToSignup={() => setAuthMode('signup')}
        />
      );
    }

    return (
      <SignupView
        onSignupSuccess={handleAuthSuccess}
        onSwitchToLogin={() => setAuthMode('login')}
      />
    );
  }

  // Page title
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'overview':
        return 'Overview Dashboard';

      case 'live-monitor':
        return 'Live Monitor & Voice Intelligence';

      case 'analyze':
        return 'Analyze Audio File';

      case 'speaker-verify':
        return 'Speaker Verification & Profiles';

      case 'threat-intel':
        return 'Threat Intelligence Center';

      case 'sessions':
        return 'Session History Archive';

      case 'alerts':
        return 'Security Operations Alert Center';

      case 'analytics':
        return 'Analytics & System Performance';

      case 'demo-mode':
        return 'Smart India Hackathon 2026 Interactive Demo';

      case 'settings':
        return 'System Settings & Controls';

      default:
        return 'Voice Intelligence Center';
    }
  };

  // Render current page
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewView
            onNavigate={handleSetActiveTab}
          />
        );

      case 'live-monitor':
        return <LiveMonitorView />;

      case 'analyze':
        return <AnalyzeView />;

      case 'speaker-verify':
        return <SpeakerVerificationView />;

      case 'threat-intel':
        return <ThreatIntelView />;

      case 'sessions':
        return <SessionsView />;

      case 'alerts':
        return <AlertsView />;

      case 'demo-mode':
        return <DemoModeView />;

      case 'analytics':
      case 'settings':
      default:
        return (
          <OverviewView
            onNavigate={handleSetActiveTab}
          />
        );
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F17] text-gray-100 overflow-x-hidden">

      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <div className="flex min-h-screen w-full">

        {/* Sidebar */}
        <div
          className={`
            fixed inset-y-0 left-0 z-50
            w-[280px] max-w-[85vw]
            transform transition-transform duration-300 ease-in-out

            lg:relative
            lg:translate-x-0
            lg:w-64
            lg:max-w-none

            ${
              isMobileSidebarOpen
                ? 'translate-x-0'
                : '-translate-x-full lg:translate-x-0'
            }
          `}
        >
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() =>
              setIsMobileSidebarOpen(false)
            }
          />
        </div>

        {/* Main application */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Header */}
          <Header
            title={getTabTitle(activeTab)}
            user={authUser}
            onLogout={handleLogout}
            onToggleMobileSidebar={() =>
              setIsMobileSidebarOpen(
                (previous) => !previous
              )
            }
          />

          {/* Page content */}
          <main className="min-w-0 flex-1 w-full overflow-x-hidden">
            {renderContent()}
          </main>

        </div>
      </div>
    </div>
  );
}
