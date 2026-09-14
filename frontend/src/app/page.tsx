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
import { AnalyticsView } from '@/components/AnalyticsView';
import { SettingsView } from '@/components/SettingsView';

import { LoginView } from '@/components/LoginView';
import { SignupView } from '@/components/SignupView';

/* =========================================================
   USER TYPE
   ========================================================= */

export type AuthUser = {
  id?: number | string;
  username: string;
  email?: string;
  role: string;
  is_active?: boolean;
  token: string;
};

/* =========================================================
   API HOST
   ========================================================= */

const API_HOST =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000';

/* =========================================================
   HOME
   ========================================================= */

export default function Home() {
  /* -------------------------------------------------------
     ACTIVE TAB
  ------------------------------------------------------- */

  const [activeTab, setActiveTab] =
    useState('overview');

  /* -------------------------------------------------------
     AUTHENTICATION
  ------------------------------------------------------- */

  const [authUser, setAuthUser] =
    useState<AuthUser | null>(null);

  const [authMode, setAuthMode] =
    useState<'login' | 'signup'>('login');

  const [initialized, setInitialized] =
    useState(false);

  /* -------------------------------------------------------
     MOBILE SIDEBAR
  ------------------------------------------------------- */

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] =
    useState(false);

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    try {
      localStorage.removeItem('vigil_token');
      localStorage.removeItem('vigil_user');
    } catch (error) {
      console.error(
        'Failed to clear VIGIL session:',
        error
      );
    }

    setAuthUser(null);
    setAuthMode('login');
    setActiveTab('overview');
    setIsMobileSidebarOpen(false);
  };

  /* =======================================================
     RESTORE AUTHENTICATION
  ======================================================= */

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token =
          localStorage.getItem('vigil_token');

        const userStr =
          localStorage.getItem('vigil_user');

        /* -----------------------------------------------
           No saved session
        ------------------------------------------------ */

        if (!token || !userStr) {
          setInitialized(true);
          return;
        }

        let storedUser: any;

        try {
          storedUser = JSON.parse(userStr);
        } catch {
          console.warn(
            'Invalid stored VIGIL user data.'
          );

          handleLogout();
          setInitialized(true);
          return;
        }

        /* -----------------------------------------------
           Immediately restore local session
        ------------------------------------------------ */

        setAuthUser({
          id: storedUser?.id,
          username:
            storedUser?.username || 'User',
          email:
            storedUser?.email || '',
          role:
            storedUser?.role || 'ANALYST',
          is_active:
            storedUser?.is_active ?? true,
          token,
        });

        /* -----------------------------------------------
           Verify JWT against backend
        ------------------------------------------------ */

        try {
          const response = await fetch(
            `${API_HOST}/api/auth/me`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              },
            }
          );

          /* -------------------------------------------
             Invalid / expired token
          -------------------------------------------- */

          if (response.status === 401) {
            console.warn(
              'VIGIL session expired.'
            );

            handleLogout();
            setInitialized(true);
            return;
          }

          /* -------------------------------------------
             Valid user
          -------------------------------------------- */

          if (response.ok) {
            const backendUser =
              await response.json();

            const completeUser: AuthUser = {
              id:
                backendUser?.id ??
                storedUser?.id,

              username:
                backendUser?.username ??
                storedUser?.username ??
                'User',

              email:
                backendUser?.email ??
                storedUser?.email ??
                '',

              role:
                backendUser?.role ??
                storedUser?.role ??
                'ANALYST',

              is_active:
                backendUser?.is_active ??
                storedUser?.is_active ??
                true,

              token,
            };

            setAuthUser(completeUser);

            localStorage.setItem(
              'vigil_user',
              JSON.stringify({
                id: completeUser.id,
                username: completeUser.username,
                email: completeUser.email,
                role: completeUser.role,
                is_active:
                  completeUser.is_active,
              })
            );
          }
        } catch (error) {
          /*
           * If backend is temporarily unavailable,
           * keep the local session rather than logging
           * the user out unnecessarily.
           */

          console.warn(
            'Could not verify VIGIL session with backend:',
            error
          );
        }
      } catch (error) {
        console.error(
          'Failed to restore VIGIL session:',
          error
        );
      } finally {
        setInitialized(true);
      }
    };

    restoreSession();
  }, []);

  /* =======================================================
     CHANGE TAB
  ======================================================= */

  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
  };

  /* =======================================================
     LOGIN / SIGNUP SUCCESS
  ======================================================= */

  const handleAuthSuccess = (user: {
    username: string;
    role: string;
    token: string;
    email?: string;
    id?: number | string;
    is_active?: boolean;
  }) => {
    const completeUser: AuthUser = {
      id: user.id,
      username: user.username,
      email: user.email || '',
      role: user.role,
      is_active:
        user.is_active ?? true,
      token: user.token,
    };

    setAuthUser(completeUser);

    /* -----------------------------------------------
       Persist complete user
    ------------------------------------------------ */

    try {
      localStorage.setItem(
        'vigil_token',
        user.token
      );

      localStorage.setItem(
        'vigil_user',
        JSON.stringify({
          id: completeUser.id,
          username: completeUser.username,
          email: completeUser.email,
          role: completeUser.role,
          is_active:
            completeUser.is_active,
        })
      );
    } catch (error) {
      console.error(
        'Failed to save VIGIL session:',
        error
      );
    }

    setActiveTab('overview');
    setIsMobileSidebarOpen(false);
  };

  /* =======================================================
     INITIAL LOADING
  ======================================================= */

  if (!initialized) {
    return (
      <div className="min-h-screen w-full bg-[#0B0F17] flex items-center justify-center text-gray-400">
        <div className="text-center">

          <div className="mb-4 text-2xl font-black tracking-[0.25em] text-white">
            VIGIL
          </div>

          <div className="mb-3 text-sm text-gray-500">
            Initializing Voice Security Center...
          </div>

          <div className="mx-auto h-1 w-32 overflow-hidden rounded-full bg-gray-800">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-400" />
          </div>

        </div>
      </div>
    );
  }

  /* =======================================================
     LOGIN / SIGNUP
  ======================================================= */

  if (!authUser) {
    if (authMode === 'login') {
      return (
        <LoginView
          onLoginSuccess={handleAuthSuccess}
          onSwitchToSignup={() =>
            setAuthMode('signup')
          }
        />
      );
    }

    return (
      <SignupView
        onSignupSuccess={handleAuthSuccess}
        onSwitchToLogin={() =>
          setAuthMode('login')
        }
      />
    );
  }

  /* =======================================================
     PAGE TITLE
  ======================================================= */

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

  /* =======================================================
     RENDER ACTIVE VIEW
  ======================================================= */

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
        return (
          <SpeakerVerificationView />
        );

      case 'threat-intel':
        return <ThreatIntelView />;

      case 'sessions':
        return <SessionsView />;

      case 'alerts':
        return <AlertsView />;

      case 'demo-mode':
        return <DemoModeView />;

      case 'analytics':
        return (
          <AnalyticsView
            user={authUser}
          />
        );

      case 'settings':
        return (
          <SettingsView
            user={authUser}
            onLogout={handleLogout}
          />
        );

      default:
        return (
          <OverviewView
            onNavigate={handleSetActiveTab}
          />
        );
    }
  };

  /* =======================================================
     MAIN APPLICATION
  ======================================================= */

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0B0F17] text-gray-100">

      {/* =================================================
          MOBILE BACKDROP
      ================================================= */}

      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() =>
            setIsMobileSidebarOpen(false)
          }
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

      {/* =================================================
          APPLICATION LAYOUT
      ================================================= */}

      <div className="flex min-h-screen w-full">

        {/* =================================================
            SIDEBAR
        ================================================= */}

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
            setActiveTab={
              handleSetActiveTab
            }
            isOpenMobile={
              isMobileSidebarOpen
            }
            onCloseMobile={() =>
              setIsMobileSidebarOpen(false)
            }
          />
        </div>

        {/* =================================================
            MAIN AREA
        ================================================= */}

        <div className="flex min-w-0 flex-1 flex-col">

          {/* =================================================
              HEADER
          ================================================= */}

          <Header
            title={getTabTitle(activeTab)}
            user={authUser}
            onLogout={handleLogout}
            onToggleMobileSidebar={() =>
              setIsMobileSidebarOpen(
                previous => !previous
              )
            }
          />

          {/* =================================================
              PAGE CONTENT
          ================================================= */}

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
