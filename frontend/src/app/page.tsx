'use client';

import React, {
  useState,
  useEffect,
} from 'react';

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
import { PendingApprovalView } from '@/components/PendingApprovalView';


interface AuthUser {
  username: string;
  role: string;
  token: string;
  account_status: string;
}


export default function Home() {

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    'overview'
  );


  const [
    authUser,
    setAuthUser,
  ] = useState<AuthUser | null>(
    null
  );


  const [
    authMode,
    setAuthMode,
  ] = useState<
    'login' | 'signup'
  >('login');


  const [
    initialized,
    setInitialized,
  ] = useState(false);


  const [
    pendingUser,
    setPendingUser,
  ] = useState<string | null>(
    null
  );


  // ==========================================================
  // RESTORE SESSION
  // ==========================================================

  useEffect(() => {

    try {

      const token =
        localStorage.getItem(
          'vigil_token'
        );


      const userStr =
        localStorage.getItem(
          'vigil_user'
        );


      if (
        token &&
        userStr
      ) {

        const userObj =
          JSON.parse(
            userStr
          );


        setAuthUser({
          username:
            userObj.username,

          role:
            userObj.role,

          token,

          account_status:
            userObj.account_status
            || 'ACTIVE',
        });
      }

    } catch {

      // Ignore malformed
      // localStorage state.

    }


    setInitialized(true);

  }, []);


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {

    setPendingUser(null);

    localStorage.removeItem(
      'vigil_token'
    );

    localStorage.removeItem(
      'vigil_user'
    );

    setAuthUser(null);

    setAuthMode(
      'login'
    );
  };


  // ==========================================================
  // AUTH SUCCESS
  // ==========================================================

  const handleAuthSuccess = (
    user: AuthUser
  ) => {

    if (
      user.account_status
      === 'PENDING'
    ) {

      setPendingUser(
        user.username
      );

      return;
    }


    setAuthUser(
      user
    );


    setActiveTab(
      'overview'
    );
  };


  // ==========================================================
  // INITIALIZATION SCREEN
  // ==========================================================

  if (!initialized) {

    return (

      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-gray-400 text-sm">

        Loading VIGIL...

      </div>
    );
  }


  // ==========================================================
  // LOGIN / SIGNUP
  // ==========================================================

  if (!authUser) {

    if (pendingUser) {

      return (

        <PendingApprovalView
          username={
            pendingUser
          }

          onLogout={() => {

            setPendingUser(
              null
            );

            setAuthMode(
              'login'
            );
          }}
        />

      );
    }


    if (
      authMode
      === 'login'
    ) {

      return (

        <LoginView

          onLoginSuccess={
            handleAuthSuccess
          }

          onSwitchToSignup={() =>
            setAuthMode(
              'signup'
            )
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
          setAuthMode(
            'login'
          )
        }

      />

    );
  }


  // ==========================================================
  // PAGE TITLE
  // ==========================================================

  const getTabTitle = (
    tab: string
  ) => {

    switch (tab) {

      case 'overview':
        return 'Overview Dashboard';

      case 'live-monitor':
        return (
          'Live Monitor & Voice Intelligence'
        );

      case 'analyze':
        return 'Analyze Audio File';

      case 'speaker-verify':
        return (
          'Speaker Verification & Profiles'
        );

      case 'threat-intel':
        return (
          'Threat Intelligence Center'
        );

      case 'sessions':
        return (
          'Session History Archive'
        );

      case 'alerts':
        return (
          'Security Operations Alert Center'
        );

      case 'analytics':
        return (
          'Analytics & System Performance'
        );

      case 'demo-mode':
        return (
          'Smart India Hackathon 2026 Interactive Demo'
        );

      case 'settings':
        return (
          'System Settings & Controls'
        );

      default:
        return (
          'Voice Intelligence Center'
        );
    }
  };


  // ==========================================================
  // CONTENT
  // ==========================================================

  const renderContent = () => {

    switch (activeTab) {

      case 'overview':

        return (
          <OverviewView
            onNavigate={
              setActiveTab
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


      case 'demo-mode':

        return (
          <DemoModeView />
        );


      default:

        return (
          <OverviewView
            onNavigate={
              setActiveTab
            }
          />
        );
    }
  };


  // ==========================================================
  // AUTHENTICATED APPLICATION
  // ==========================================================

  return (

    <div className="flex h-screen bg-[#0B0F17] overflow-hidden text-gray-100">

      <Sidebar
        activeTab={
          activeTab
        }

        setActiveTab={
          setActiveTab
        }
      />


      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        <Header
          title={
            getTabTitle(
              activeTab
            )
          }

          user={
            authUser
          }

          onLogout={
            handleLogout
          }
        />


        <main className="flex-1">

          {renderContent()}

        </main>

      </div>

    </div>
  );
}
