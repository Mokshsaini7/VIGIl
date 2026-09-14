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
   TYPES
   ========================================================= */

export interface AuthUser {
  id?: number | string;
  username: string;
  email?: string;
  role: string;
  is_active?: boolean;
  token: string;
}

/* =========================================================
   API
   ========================================================= */

const API_HOST =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000';

/* =========================================================
   HOME
   ========================================================= */

export default function Home() {
  /* =======================================================
     ACTIVE TAB
     ======================================================= */

  const [activeTab, setActiveTab] =
    useState('overview');

  /* =======================================================
     AUTHENTICATION
     ======================================================= */

  const [authUser, setAuthUser] =
    useState<AuthUser | null>(null);

  const [authMode, setAuthMode] =
    useState<'login' | 'signup'>('login');

  const [initialized, setInitialized] =
    useState(false);

  /* =======================================================
     MOBILE SIDEBAR
     ======================================================= */

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] =
    useState(false);

  /* =======================================================
     RESTORE AUTHENTICATED SESSION
     ======================================================= */

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token =
          localStorage.getItem('vigil_token');

        const userStr =
          localStorage.getItem('vigil_user');

        /*
         * No stored session.
         */

        if (!token || !userStr) {
          setInitialized(true);
          return;
        }

        let storedUser: any;

        try {
          storedUser = JSON.parse(userStr);
        } catch {
          localStorage.removeItem('vigil_token');
          localStorage.removeItem('vigil_user');

          setInitialized(true);
          return;
        }

        /*
         * First restore immediately from localStorage.
         * This makes the application load quickly.
         */

        setAuthUser({
          id: storedUser?.id,
          username:
            storedUser?.username ||
            'VIGIL User',
          email:
            storedUser?.email,
          role:
            storedUser?.role ||
            'ANALYST',
          is_active:
            storedUser?.is_active ?? true,
          token,
        });

        /*
         * Then ask the backend for the latest
         * authenticated user information.
         */

        try {
          const response =
            await fetch(
              `${API_HOST}/api/auth/me`,
              {
                method: 'GET',
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                  'Content-Type':
                    'application/json',
                },
                cache: 'no-store',
              }
            );

          /*
           * Token is invalid/expired.
           */

          if (response.status === 401) {
            localStorage.removeItem(
              'vigil_token'
            );

            localStorage.removeItem(
              'vigil_user'
            );

            setAuthUser(null);
            setInitialized(true);

            return;
          }

          if (response.ok) {
            const latestUser =
              await response.json();

            const updatedUser: AuthUser = {
              id:
                latestUser?.id ??
                storedUser?.id,

              username:
                latestUser?.username ??
                storedUser?.username ??
                'VIGIL User',

              email:
                latestUser?.email ??
                storedUser?.email,

              role:
                latestUser?.role ??
                storedUser?.role ??
                'ANALYST',

              is_active:
                latestUser?.is_active ??
                storedUser?.is_active ??
                true,

              token,
            };

            setAuthUser(updatedUser);

            /*
             * Keep localStorage synchronized with
             * the latest backend user information.
             */

            localStorage.setItem(
              'vigil_user',
              JSON.stringify({
                id: updatedUser.id,
                username:
                  updatedUser.username,
                email:
                  updatedUser.email,
                role:
                  updatedUser.role,
                is_active:
                  updatedUser.is_active,
              })
            );
          }
        } catch (apiError) {
          /*
           * If backend is temporarily unavailable,
           * keep the locally restored session.
           */

          console.warn(
            'Could not refresh VIGIL user profile:',
            apiError
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

  const handleSetActiveTab = (
    tab: string
  ) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
  };

  /* =======================================================
     LOGOUT
     ======================================================= */

  const handleLogout = () => {
    /*
     * Remove all VIGIL authentication data.
     */

    localStorage.removeItem(
      'vigil_token'
    );

    localStorage.removeItem(
      'vigil_user'
    );

    /*
     * Remove optional locally stored
     * VIGIL preferences.
     */

    localStorage.removeItem(
      'vigil_risk_settings'
    );

    /*
     * Reset application state.
     */

    setAuthUser(null);
    setAuthMode('login');
    setActiveTab('overview');
    setIsMobileSidebarOpen(false);
  };

  /* =======================================================
     LOGIN / SIGNUP SUCCESS
     ======================================================= */

  const handleAuthSuccess = (
    user: {
      username: string;
      role: string;
      token: string;
      id?: number | string;
      email?: string;
      is_active?: boolean;
    }
  ) => {
    const normalizedUser: AuthUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_active:
        user.is_active ?? true,
      token: user.token,
    };

    /*
     * Store token.
     */

    localStorage.setItem(
      'vigil_token',
      user.token
    );

    /*
     * Store user profile.
     */

    localStorage.setItem(
      'vigil_user',
      JSON.stringify({
        id: normalizedUser.id,
        username:
          normalizedUser.username,
        email:
          normalizedUser.email,
        role:
          normalizedUser.role,
        is_active:
          normalizedUser.is_active,
      })
    );

    setAuthUser(normalizedUser);

    setActiveTab('overview');

    setIsMobileSidebarOpen(false);
  };

  /* =======================================================
     INITIAL LOADING
     ======================================================= */

  if (!initialized) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#0B0F17] text-gray-400">

        <div className="text-center">

          <div className="mb-3 flex items-center justify-center">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-xl font-black text-blue-400 shadow-lg shadow-blue-500/10">
              V
            </div>

          </div>

          <div className="text-xl font-black tracking-wider text-white">
            VIGIL
          </div>

          <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-gray-500">
            Voice Security Center
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-500">

            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />

            Initializing secure environment...

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
          onLoginSuccess={
            handleAuthSuccess
          }
          onSwitchToSignup={() =>
            setAuthMode('signup')
          }
        />
      );
    }

    return (
      <SignupView
        onSignupSuccess={
          handleAuthSuccess
        }
        onSwitchToLogin={() =>
          setAuthMode('login')
        }
      />
    );
  }

  /* =======================================================
     PAGE TITLE
     ======================================================= */

  const getTabTitle = (
    tab: string
  ) => {
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
            onNavigate={
              handleSetActiveTab
            }
          />
        );

      case 'live-monitor':
        return (
          <LiveMonitorView />
        );

      case 'analyze':
        return (
          <AnalyzeView />
        );

      case 'speaker-verify':
        return (
          <SpeakerVerificationView />
        );

      case 'threat-intel':
        return (
          <ThreatIntelView />
        );

      case 'sessions':
        return (
          <SessionsView />
        );

      case 'alerts':
        return (
          <AlertsView />
        );

      case 'analytics':
        return (
          <AnalyticsView />
        );

      case 'demo-mode':
        return (
          <DemoModeView />
        );

      case 'settings':
        return (
          <SettingsView
            user={authUser}
            onLogout={
              handleLogout
            }
          />
        );

      default:
        return (
          <OverviewView
            onNavigate={
              handleSetActiveTab
            }
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
          MOBILE SIDEBAR BACKDROP
      ================================================= */}

      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() =>
            setIsMobileSidebarOpen(
              false
            )
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
            activeTab={
              activeTab
            }
            setActiveTab={
              handleSetActiveTab
            }
            isOpenMobile={
              isMobileSidebarOpen
            }
            onCloseMobile={() =>
              setIsMobileSidebarOpen(
                false
              )
            }
          />
        </div>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <div className="flex min-w-0 flex-1 flex-col">

          {/* =================================================
              HEADER
          ================================================= */}

          <Header
            title={getTabTitle(
              activeTab
            )}
            user={authUser}
            onLogout={
              handleLogout
            }
            onToggleMobileSidebar={() =>
              setIsMobileSidebarOpen(
                (previous) =>
                  !previous
              )
            }
          />

          {/* =================================================
              CONTENT
          ================================================= */}

          <main
            className="
              min-h-0
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
