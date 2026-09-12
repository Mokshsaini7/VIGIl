'use client';

import React, { useState, useEffect } from 'react';

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
  // --------------------------------------------------
  // ACTIVE TAB
  // --------------------------------------------------
  const [activeTab, setActiveTab] = useState('overview');

  // --------------------------------------------------
  // AUTHENTICATION
  // --------------------------------------------------
  const [authUser, setAuthUser] = useState<{
    username: string;
    role: string;
    token: string;
  } | null>(null);

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const [initialized, setInitialized] = useState(false);

  // --------------------------------------------------
  // MOBILE SIDEBAR
  // --------------------------------------------------
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // --------------------------------------------------
  // RESTORE LOGIN SESSION
  // --------------------------------------------------
  useEffect(() => {
    try {
      const token = localStorage.getItem('vigil_token');
      const userStr = localStorage.getItem('vigil_user');

      if (token && userStr) {
        const userObj = JSON.parse(userStr);

        setAuthUser({
          username: userObj.username,
          role: userObj.role,
          token: token,
        });
      }
    } catch (error) {
      console.error('Failed to restore VIGIL session:', error);
    }

    setInitialized(true);
  }, []);

  // --------------------------------------------------
  // CHANGE TAB
  // Also closes mobile sidebar
  // --------------------------------------------------
  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------
  const handleLogout = () => {
    localStorage.removeItem('vigil_token');
    localStorage.removeItem('vigil_user');

    setAuthUser(null);
    setAuthMode('login');
    setIsMobileSidebarOpen(false);
  };

  // --------------------------------------------------
  // LOGIN / SIGNUP SUCCESS
  // --------------------------------------------------
  const handleAuthSuccess = (user: {
    username: string;
    role: string;
    token: string;
  }) => {
    setAuthUser(user);
    setActiveTab('overview');
    setIsMobileSidebarOpen(false);
  };

  // --------------------------------------------------
  // INITIAL LOADING
  // --------------------------------------------------
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

  // --------------------------------------------------
  // LOGIN / SIGNUP
  // --------------------------------------------------
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

  // --------------------------------------------------
  // PAGE TITLE
  // --------------------------------------------------
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

  // --------------------------------------------------
  // RENDER ACTIVE VIEW
  // --------------------------------------------------
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

      // These pages don't currently have
      // dedicated view components.
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

  // --------------------------------------------------
  // MAIN APPLICATION
  // --------------------------------------------------
  return (
    <div className="min-h-screen w-full bg-[#0B0F17] text-gray-100 overflow-x-hidden">

      {/* ================================================
          MOBILE SIDEBAR BACKDROP
          ================================================ */}
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="
            fixed
            inset-0
            z-40
            bg-black/60
            backdrop-blur-sm
            lg:hidden
          "
        />
      )}

      {/* ================================================
          APPLICATION LAYOUT
          ================================================ */}
      <div className="flex min-h-screen w-full">

        {/* ================================================
            SIDEBAR
            ================================================ */}
        <div
          className={`
            fixed
            inset-y-0
            left-0
            z-50

            w-[280px]
            max-w-[85vw]

            transform
            transition-transform
            duration-300
            ease-in-out

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

        {/* ================================================
            MAIN CONTENT AREA
            ================================================ */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* ================================================
              HEADER
              ================================================ */}
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

          {/* ================================================
              PAGE CONTENT
              ================================================ */}
          <main
            className="
              min-w-0
              flex-1
              w-full
              overflow-x-hidden
            "
          >
            {renderContent()}
          </main>

        </div>
      </div>
    </div>
  );
}