'use client';

import React, { useEffect, useState } from 'react';

import {
  Settings,
  User,
  ShieldCheck,
  Sliders,
  Database,
  Lock,
  CheckCircle2,
  LogOut,
  Mail,
  Shield,
  Activity,
  Server,
  Info,
  Users,
  Target,
  Cpu,
  Globe,
  KeyRound,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

/* =========================================================
   TYPES
   ========================================================= */

interface SettingsUser {
  id?: number | string;
  username: string;
  email?: string;
  role: string;
  is_active?: boolean;
  token: string;
}

interface SettingsViewProps {
  user: SettingsUser | null;
  onLogout?: () => void;
}

/* =========================================================
   API
   ========================================================= */

const API_HOST =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000';

/* =========================================================
   COMPONENT
   ========================================================= */

export const SettingsView: React.FC<
  SettingsViewProps
> = ({ user, onLogout }) => {
  /* =======================================================
     RISK SETTINGS
     ======================================================= */

  const [syntheticThreshold, setSyntheticThreshold] =
    useState(65);

  const [mismatchThreshold, setMismatchThreshold] =
    useState(72);

  const [urgencyWeight, setUrgencyWeight] =
    useState(15);

  const [savedSuccess, setSavedSuccess] =
    useState(false);

  /* =======================================================
     PASSWORD
     ======================================================= */

  const [oldPassword, setOldPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [pwdLoading, setPwdLoading] =
    useState(false);

  const [pwdSuccess, setPwdSuccess] =
    useState(false);

  const [pwdError, setPwdError] =
    useState('');

  /* =======================================================
     SYSTEM STATUS
     ======================================================= */

  const [backendStatus, setBackendStatus] =
    useState<'checking' | 'online' | 'offline'>(
      'checking'
    );

  const [databaseStatus, setDatabaseStatus] =
    useState<'checking' | 'online' | 'offline'>(
      'checking'
    );

  const [lastChecked, setLastChecked] =
    useState('');

  /* =======================================================
     CHECK SYSTEM STATUS
     ======================================================= */

  const checkSystemStatus = async () => {
    setBackendStatus('checking');
    setDatabaseStatus('checking');

    try {
      const backendResponse =
        await fetch(
          `${API_HOST}/health`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        );

      setBackendStatus(
        backendResponse.ok
          ? 'online'
          : 'offline'
      );
    } catch {
      setBackendStatus('offline');
    }

    try {
      const databaseResponse =
        await fetch(
          `${API_HOST}/health/db`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        );

      setDatabaseStatus(
        databaseResponse.ok
          ? 'online'
          : 'offline'
      );
    } catch {
      setDatabaseStatus('offline');
    }

    setLastChecked(
      new Date().toLocaleTimeString()
    );
  };

  useEffect(() => {
    checkSystemStatus();
  }, []);

  /* =======================================================
     SAVE RISK CONFIGURATION
     ======================================================= */

  const handleSaveSettings = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    /*
     * These settings are currently maintained locally
     * because the backend settings endpoint has not yet
     * been added.
     */

    try {
      localStorage.setItem(
        'vigil_risk_settings',
        JSON.stringify({
          syntheticThreshold,
          mismatchThreshold,
          urgencyWeight,
        })
      );
    } catch {
      // Ignore local storage failures.
    }

    setSavedSuccess(true);

    window.setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  /* =======================================================
     RESTORE RISK SETTINGS
     ======================================================= */

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          'vigil_risk_settings'
        );

      if (!saved) return;

      const parsed =
        JSON.parse(saved);

      if (
        typeof parsed.syntheticThreshold ===
        'number'
      ) {
        setSyntheticThreshold(
          parsed.syntheticThreshold
        );
      }

      if (
        typeof parsed.mismatchThreshold ===
        'number'
      ) {
        setMismatchThreshold(
          parsed.mismatchThreshold
        );
      }

      if (
        typeof parsed.urgencyWeight ===
        'number'
      ) {
        setUrgencyWeight(
          parsed.urgencyWeight
        );
      }
    } catch {
      // Ignore invalid saved settings.
    }
  }, []);

  /* =======================================================
     PASSWORD CHANGE
     ======================================================= */

  const handlePasswordChange = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setPwdError('');
    setPwdSuccess(false);

    if (!oldPassword || !newPassword) {
      setPwdError(
        'Please enter your current and new password.'
      );
      return;
    }

    if (newPassword.length < 6) {
      setPwdError(
        'New password must contain at least 6 characters.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError(
        'New password and confirmation do not match.'
      );
      return;
    }

    if (!user?.token) {
      setPwdError(
        'Your session is not available. Please login again.'
      );
      return;
    }

    setPwdLoading(true);

    try {
      const response =
        await fetch(
          `${API_HOST}/api/auth/change-password`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${user.token}`,
            },
            body: JSON.stringify({
              current_password:
                oldPassword,

              new_password:
                newPassword,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        setPwdError(
          data?.detail ||
            'Unable to change password.'
        );

        return;
      }

      setPwdSuccess(true);

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      window.setTimeout(() => {
        setPwdSuccess(false);
      }, 4000);
    } catch {
      setPwdError(
        'Unable to connect to the VIGIL backend.'
      );
    } finally {
      setPwdLoading(false);
    }
  };

  /* =======================================================
     USER DISPLAY DATA
     ======================================================= */

  const username =
    user?.username || 'Authenticated User';

  const email =
    user?.email || 'Email not available';

  const role =
    user?.role || 'ANALYST';

  const accountActive =
    user?.is_active ?? true;

  const initials =
    username
      .split(' ')
      .filter(Boolean)
      .map(
        (part) =>
          part.charAt(0).toUpperCase()
      )
      .slice(0, 2)
      .join('') || 'VU';

  /* =======================================================
     STATUS COMPONENT
     ======================================================= */

  const StatusBadge = ({
    status,
  }: {
    status:
      | 'checking'
      | 'online'
      | 'offline';
  }) => {
    if (status === 'checking') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400">
          <RefreshCw className="h-3 w-3 animate-spin" />
          CHECKING
        </span>
      );
    }

    if (status === 'online') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          ONLINE
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        OFFLINE
      </span>
    );
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="w-full min-w-0 p-4 sm:p-6">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="mb-6 border-b border-[#26334D] pb-5">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Settings className="h-5 w-5 text-blue-400" />
              </div>

              <h1 className="text-xl font-bold text-white sm:text-2xl">
                System Settings
              </h1>
            </div>

            <p className="max-w-2xl text-xs leading-5 text-gray-400 sm:text-sm">
              Manage your VIGIL account, security
              configuration, authentication and
              system preferences.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#26334D] bg-[#121824] px-3 py-2">
            <Activity className="h-4 w-4 text-emerald-400" />

            <div>
              <div className="text-[9px] uppercase tracking-wider text-gray-500">
                Session
              </div>

              <div className="text-xs font-semibold text-emerald-400">
                ACTIVE
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* =================================================
          PROFILE + SECURITY
      ================================================= */}

      <div className="grid w-full grid-cols-1 gap-5 xl:grid-cols-2">

        {/* =================================================
            MY PROFILE
        ================================================= */}

        <section className="rounded-2xl border border-[#26334D] bg-[#121824] p-5 shadow-xl">

          <div className="mb-5 flex items-center justify-between border-b border-[#26334D] pb-4">

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" />

              <h2 className="text-sm font-bold text-white">
                My Profile
              </h2>
            </div>

            <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-400">
              VERIFIED SESSION
            </span>

          </div>

          {/* PROFILE HERO */}

          <div className="mb-5 flex items-center gap-4 rounded-xl border border-[#26334D] bg-[#192233] p-4">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/10 text-xl font-black text-blue-400">
              {initials}
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-white">
                {username}
              </h3>

              <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">
                  {email}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">

                <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[9px] font-bold text-blue-400">
                  {role}
                </span>

                {accountActive ? (
                  <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-400">
                    ACCOUNT ACTIVE
                  </span>
                ) : (
                  <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[9px] font-bold text-red-400">
                    ACCOUNT INACTIVE
                  </span>
                )}

              </div>
            </div>
          </div>

          {/* ACCOUNT DETAILS */}

          <div className="space-y-2">

            <div className="flex items-center justify-between rounded-lg border border-[#26334D] bg-[#192233] px-3 py-3">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs text-gray-400">
                  Username
                </span>
              </div>

              <span className="max-w-[55%] truncate text-xs font-semibold text-white">
                {username}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#26334D] bg-[#192233] px-3 py-3">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs text-gray-400">
                  Email
                </span>
              </div>

              <span className="max-w-[55%] truncate text-xs font-semibold text-white">
                {email}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#26334D] bg-[#192233] px-3 py-3">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs text-gray-400">
                  Security Role
                </span>
              </div>

              <span className="rounded-md bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-400">
                {role}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#26334D] bg-[#192233] px-3 py-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs text-gray-400">
                  Authentication
                </span>
              </div>

              <span className="text-xs font-semibold text-emerald-400">
                JWT ACTIVE
              </span>
            </div>

          </div>

          {/* LOGOUT */}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="
                mt-5
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-red-500/30
                bg-red-500/10
                px-4
                py-3
                text-xs
                font-bold
                text-red-400
                transition
                hover:border-red-500/50
                hover:bg-red-500/20
                hover:text-red-300
              "
            >
              <LogOut className="h-4 w-4" />
              LOG OUT OF VIGIL
            </button>
          )}

        </section>

        {/* =================================================
            PASSWORD SECURITY
        ================================================= */}

        <section className="rounded-2xl border border-[#26334D] bg-[#121824] p-5 shadow-xl">

          <div className="mb-5 border-b border-[#26334D] pb-4">

            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-purple-400" />

              <h2 className="text-sm font-bold text-white">
                Account Security
              </h2>
            </div>

            <p className="mt-1 text-[11px] text-gray-500">
              Update your VIGIL account password.
            </p>

          </div>

          <form
            onSubmit={
              handlePasswordChange
            }
            className="space-y-4"
          >

            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-gray-400">
                Current Password
              </label>

              <input
                type="password"
                value={oldPassword}
                onChange={(event) =>
                  setOldPassword(
                    event.target.value
                  )
                }
                placeholder="Enter current password"
                className="
                  w-full
                  rounded-xl
                  border
                  border-[#26334D]
                  bg-[#192233]
                  px-3
                  py-3
                  text-sm
                  text-white
                  outline-none
                  transition
                  placeholder:text-gray-600
                  focus:border-blue-500
                "
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-gray-400">
                New Password
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(
                    event.target.value
                  )
                }
                placeholder="Enter new password"
                className="
                  w-full
                  rounded-xl
                  border
                  border-[#26334D]
                  bg-[#192233]
                  px-3
                  py-3
                  text-sm
                  text-white
                  outline-none
                  transition
                  placeholder:text-gray-600
                  focus:border-blue-500
                "
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-gray-400">
                Confirm New Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Confirm new password"
                className="
                  w-full
                  rounded-xl
                  border
                  border-[#26334D]
                  bg-[#192233]
                  px-3
                  py-3
                  text-sm
                  text-white
                  outline-none
                  transition
                  placeholder:text-gray-600
                  focus:border-blue-500
                "
              />
            </div>

            {pwdError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            {pwdSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Password updated successfully.
              </div>
            )}

            <button
              type="submit"
              disabled={pwdLoading}
              className="
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-blue-600
                px-4
                py-3
                text-xs
                font-bold
                text-white
                shadow-lg
                shadow-blue-600/20
                transition
                hover:bg-blue-500
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {pwdLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  UPDATING...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  UPDATE PASSWORD
                </>
              )}
            </button>

          </form>
        </section>

      </div>

      {/* =================================================
          RISK ENGINE
      ================================================= */}

      <section className="mt-5 rounded-2xl border border-[#26334D] bg-[#121824] p-5 shadow-xl">

        <div className="mb-5 flex flex-col gap-2 border-b border-[#26334D] pb-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-400" />

              <h2 className="text-sm font-bold text-white">
                AI Risk Engine Configuration
              </h2>
            </div>

            <p className="mt-1 text-[11px] text-gray-500">
              Configure local VIGIL risk-analysis thresholds.
            </p>
          </div>

          <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[9px] font-bold text-emerald-400">
            RISK ENGINE
          </span>

        </div>

        <form
          onSubmit={
            handleSaveSettings
          }
          className="space-y-6"
        >

          {/* SYNTHETIC */}

          <div>
            <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

              <label className="text-xs font-semibold text-gray-300">
                Synthetic AI Voice Confidence Cutoff
              </label>

              <span className="font-mono text-sm font-bold text-blue-400">
                {syntheticThreshold}%
              </span>

            </div>

            <input
              type="range"
              min="50"
              max="90"
              value={
                syntheticThreshold
              }
              onChange={(event) =>
                setSyntheticThreshold(
                  Number(
                    event.target.value
                  )
                )
              }
              className="w-full cursor-pointer accent-blue-500"
            />

            <p className="mt-1 text-[10px] leading-4 text-gray-500">
              Probability above this threshold
              is treated as suspicious synthetic
              voice evidence.
            </p>
          </div>

          {/* SPEAKER */}

          <div>
            <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

              <label className="text-xs font-semibold text-gray-300">
                Speaker Similarity Match Cutoff
              </label>

              <span className="font-mono text-sm font-bold text-emerald-400">
                {mismatchThreshold}%
              </span>

            </div>

            <input
              type="range"
              min="50"
              max="90"
              value={
                mismatchThreshold
              }
              onChange={(event) =>
                setMismatchThreshold(
                  Number(
                    event.target.value
                  )
                )
              }
              className="w-full cursor-pointer accent-emerald-500"
            />

            <p className="mt-1 text-[10px] leading-4 text-gray-500">
              Similarity below this level can
              indicate a speaker mismatch when
              a trusted profile is enrolled.
            </p>
          </div>

          {/* URGENCY */}

          <div>
            <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

              <label className="text-xs font-semibold text-gray-300">
                Urgency & Secrecy Signal Weight
              </label>

              <span className="font-mono text-sm font-bold text-amber-400">
                {urgencyWeight} pts
              </span>

            </div>

            <input
              type="range"
              min="5"
              max="30"
              value={
                urgencyWeight
              }
              onChange={(event) =>
                setUrgencyWeight(
                  Number(
                    event.target.value
                  )
                )
              }
              className="w-full cursor-pointer accent-amber-500"
            />

            <p className="mt-1 text-[10px] leading-4 text-gray-500">
              Weight applied to high-pressure
              conversation signals.
            </p>
          </div>

          <button
            type="submit"
            className="
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-blue-600
              px-4
              py-3
              text-xs
              font-bold
              text-white
              shadow-lg
              shadow-blue-600/20
              transition
              hover:bg-blue-500
            "
          >
            <CheckCircle2 className="h-4 w-4" />
            SAVE CONFIGURATION
          </button>

          {savedSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Configuration saved locally.
            </div>
          )}

        </form>
      </section>

      {/* =================================================
          SYSTEM STATUS
      ================================================= */}

      <section className="mt-5 rounded-2xl border border-[#26334D] bg-[#121824] p-5 shadow-xl">

        <div className="mb-5 flex flex-col gap-3 border-b border-[#26334D] pb-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-400" />

              <h2 className="text-sm font-bold text-white">
                System Status
              </h2>
            </div>

            <p className="mt-1 text-[11px] text-gray-500">
              Live connectivity diagnostics for VIGIL infrastructure.
            </p>
          </div>

          <button
            type="button"
            onClick={checkSystemStatus}
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-[#26334D]
              bg-[#192233]
              px-3
              py-2
              text-[10px]
              font-bold
              text-gray-300
              transition
              hover:bg-[#26334D]
            "
          >
            <RefreshCw className="h-3.5 w-3.5" />
            REFRESH
          </button>

        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

          {/* BACKEND */}

          <div className="rounded-xl border border-[#26334D] bg-[#192233] p-4">

            <div className="mb-3 flex items-center justify-between">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                <Server className="h-4 w-4 text-blue-400" />
              </div>

              <StatusBadge
                status={
                  backendStatus
                }
              />

            </div>

            <div className="text-[9px] uppercase tracking-wider text-gray-500">
              Backend API
            </div>

            <div className="mt-1 truncate text-xs font-bold text-white">
              {API_HOST}
            </div>

          </div>

          {/* DATABASE */}

          <div className="rounded-xl border border-[#26334D] bg-[#192233] p-4">

            <div className="mb-3 flex items-center justify-between">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                <Database className="h-4 w-4 text-purple-400" />
              </div>

              <StatusBadge
                status={
                  databaseStatus
                }
              />

            </div>

            <div className="text-[9px] uppercase tracking-wider text-gray-500">
              Database
            </div>

            <div className="mt-1 text-xs font-bold text-white">
              PostgreSQL / SQLAlchemy
            </div>

          </div>

          {/* AUTH */}

          <div className="rounded-xl border border-[#26334D] bg-[#192233] p-4">

            <div className="mb-3 flex items-center justify-between">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                ACTIVE
              </span>

            </div>

            <div className="text-[9px] uppercase tracking-wider text-gray-500">
              Authentication
            </div>

            <div className="mt-1 text-xs font-bold text-white">
              JWT Bearer Session
            </div>

          </div>

        </div>

        {lastChecked && (
          <div className="mt-4 text-right text-[9px] text-gray-600">
            Last checked: {lastChecked}
          </div>
        )}

      </section>

      {/* =================================================
          ABOUT VIGIL
      ================================================= */}

      <section className="mt-5 overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#121824] via-[#121824] to-blue-950/20 shadow-xl">

        <div className="border-b border-[#26334D] p-5">

          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-cyan-400" />

            <h2 className="text-sm font-bold text-white">
              About VIGIL
            </h2>
          </div>

          <p className="mt-1 text-[11px] text-gray-500">
            Voice Integrity & Impersonation Guard
          </p>

        </div>

        <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">

          {/* DESCRIPTION */}

          <div>

            <div className="mb-4 flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-lg font-black text-cyan-400">
                V
              </div>

              <div>
                <h3 className="text-xl font-black tracking-wide text-white">
                  VIGIL
                </h3>

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                  Voice Integrity & Impersonation Guard
                </p>
              </div>

            </div>

            <p className="max-w-xl text-sm leading-6 text-gray-300">
              VIGIL is an AI-powered voice security
              platform designed to detect potentially
              synthetic voices, verify trusted speakers,
              understand social-engineering intent and
              provide explainable real-time risk
              assessment.
            </p>

            <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">

              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                Mission
              </div>

              <div className="mt-2 text-sm font-bold text-white">
                Detect. Verify. Understand. Protect.
              </div>

            </div>

          </div>

          {/* PROJECT INFO */}

          <div className="grid grid-cols-2 gap-3">

            <div className="rounded-xl border border-[#26334D] bg-[#192233] p-4">

              <Target className="mb-3 h-4 w-4 text-red-400" />

              <div className="text-[9px] uppercase tracking-wider text-gray-500">
                Problem Statement
              </div>

              <div className="mt-1 text-sm font-black text-white">
                SIH26104
              </div>

            </div>

            <div className="rounded-xl border border-[#26334D] bg-[#192233] p-4">

              <Users className="mb-3 h-4 w-4 text-blue-400" />

              <div className="text-[9px] uppercase tracking-wider text-gray-500">
                Team
              </div>

              <div className="mt-1 text-sm font-black text-white">
                DATA MINDS
              </div>

            </div>

            <div className="rounded-xl border border-[#26334D] bg-[#192233] p-4">

              <Cpu className="mb-3 h-4 w-4 text-purple-400" />

              <div className="text-[9px] uppercase tracking-wider text-gray-500">
                Platform
              </div>

              <div className="mt-1 text-sm font-black text-white">
                AI + Voice Security
              </div>

            </div>

            <div className="rounded-xl border border-[#26334D] bg-[#192233] p-4">

              <Globe className="mb-3 h-4 w-4 text-emerald-400" />

              <div className="text-[9px] uppercase tracking-wider text-gray-500">
                Event
              </div>

              <div className="mt-1 text-sm font-black text-white">
                SIH 2026
              </div>

            </div>

          </div>

        </div>

        {/* TECHNOLOGY PIPELINE */}

        <div className="border-t border-[#26334D] p-5">

          <div className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
            VIGIL Detection Pipeline
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">

            {[
              'Audio',
              'Voice Detection',
              'Speaker Verification',
              'Speech-to-Text',
              'Context Analysis',
              'Risk Engine',
              'Threat Protection',
            ].map(
              (item, index) => (
                <React.Fragment key={item}>

                  <span className="rounded-lg border border-[#26334D] bg-[#192233] px-3 py-2 text-gray-300">
                    {item}
                  </span>

                  {index < 6 && (
                    <span className="text-gray-600">
                      →
                    </span>
                  )}

                </React.Fragment>
              )
            )}

          </div>

        </div>

      </section>

      {/* =================================================
          FOOTER
      ================================================= */}

      <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-[#26334D] pt-5 text-center sm:flex-row sm:text-left">

        <div className="text-[10px] text-gray-600">
          VIGIL — Voice Integrity & Impersonation Guard
        </div>

        <div className="text-[10px] font-semibold text-gray-600">
          DATA MINDS • SIH26104 • Smart India Hackathon 2026
        </div>

      </div>

    </div>
  );
};
