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
  const [activeTab, setActiveTab] = useState('overview');
  const [authUser, setAuthUser] = useState<{ username: string; role: string; token: string } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [initialized, setInitialized] = useState(false);

  // Check saved session in localStorage
  useEffect(() => {
    try {
      const token = localStorage.getItem('vigil_token');
      const userStr = localStorage.getItem('vigil_user');
      if (token && userStr) {
        const userObj = JSON.parse(userStr);
        setAuthUser({ username: userObj.username, role: userObj.role, token: token });
      }
    } catch (e) {}
    setInitialized(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('vigil_token');
    localStorage.removeItem('vigil_user');
    setAuthUser(null);
    setAuthMode('login');
  };

  const handleAuthSuccess = (user: { username: string; role: string; token: string }) => {
    setAuthUser(user);
    setActiveTab('overview');
  };

  if (!initialized) {
    return <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-gray-400 text-sm">Loading VIGIL...</div>;
  }

  // Render Login or Signup screen if not logged in
  if (!authUser) {
    if (authMode === 'login') {
      return <LoginView onLoginSuccess={handleAuthSuccess} onSwitchToSignup={() => setAuthMode('signup')} />;
    } else {
      return <SignupView onSignupSuccess={handleAuthSuccess} onSwitchToLogin={() => setAuthMode('login')} />;
    }
  }

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'overview': return 'Overview Dashboard';
      case 'live-monitor': return 'Live Monitor & Voice Intelligence';
      case 'analyze': return 'Analyze Audio File';
      case 'speaker-verify': return 'Speaker Verification & Profiles';
      case 'threat-intel': return 'Threat Intelligence Center';
      case 'sessions': return 'Session History Archive';
      case 'alerts': return 'Security Operations Alert Center';
      case 'analytics': return 'Analytics & System Performance';
      case 'demo-mode': return 'Smart India Hackathon 2026 Interactive Demo';
      case 'settings': return 'System Settings & Controls';
      default: return 'Voice Intelligence Center';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView onNavigate={setActiveTab} />;
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
      default:
        return <OverviewView onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0F17] overflow-hidden text-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title={getTabTitle(activeTab)} user={authUser} onLogout={handleLogout} />
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
