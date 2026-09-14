'use client';

import React, { useEffect, useState } from 'react';

import {
  Settings,
  User,
  Sliders,
  Database,
  CheckCircle2,
  Lock,
  RefreshCw,
  AlertTriangle,
  Save,
  Server,
} from 'lucide-react';

interface SettingsViewProps {
  user: {
    username: string;
    role: string;
    token: string;
  } | null;
}

interface UserSettings {
  synthetic_threshold: number;
  speaker_match_threshold: number;
  urgency_weight: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
}) => {
  const apiHost =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const [syntheticThreshold, setSyntheticThreshold] =
    useState(65);

  const [mismatchThreshold, setMismatchThreshold] =
    useState(72);

  const [urgencyWeight, setUrgencyWeight] = useState(15);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [changingPassword, setChangingPassword] =
    useState(false);

  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [backendStatus, setBackendStatus] = useState<
    'checking' | 'online' | 'offline'
  >('checking');

  const [databaseStatus, setDatabaseStatus] = useState<
    'checking' | 'connected' | 'offline'
  >('checking');

  const getToken = () => {
    if (user?.token) return user.token;

    if (typeof window !== 'undefined') {
      return localStorage.getItem('vigil_token') || '';
    }

    return '';
  };

  const authHeaders = () => {
    const token = getToken();

    return {
      'Content-Type': 'application/json',
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  /*
   * ---------------------------------------------------------
   * LOAD SETTINGS
   * ---------------------------------------------------------
   */

  const loadSettings = async () => {
    try {
      setLoadingSettings(true);
      setError('');

      const response = await fetch(
        `${apiHost}/api/settings`,
        {
          method: 'GET',
          headers: authHeaders(),
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error(
          `Settings request failed: ${response.status}`
        );
      }

      const data: UserSettings = await response.json();

      setSyntheticThreshold(
        Number(data.synthetic_threshold ?? 65)
      );

      setMismatchThreshold(
        Number(data.speaker_match_threshold ?? 72)
      );

      setUrgencyWeight(
        Number(data.urgency_weight ?? 15)
      );
    } catch (err) {
      console.error('Settings load error:', err);

      /*
       * Keep defaults if the endpoint is not available yet.
       * This prevents the UI from breaking while backend
       * settings support is being added.
       */
      setError(
        'Could not load saved settings. Showing default configuration.'
      );
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [user?.token]);

  /*
   * ---------------------------------------------------------
   * SYSTEM HEALTH
   * ---------------------------------------------------------
   */

  const checkSystemHealth = async () => {
    setBackendStatus('checking');
    setDatabaseStatus('checking');

    try {
      const response = await fetch(
        `${apiHost}/health`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error('Backend offline');
      }

      setBackendStatus('online');
    } catch {
      setBackendStatus('offline');
    }

    try {
      const response = await fetch(
        `${apiHost}/health/db`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (
        response.ok &&
        data?.status === 'healthy'
      ) {
        setDatabaseStatus('connected');
      } else {
        setDatabaseStatus('offline');
      }
    } catch {
      setDatabaseStatus('offline');
    }
  };

  useEffect(() => {
    checkSystemHealth();

    const interval = setInterval(
      checkSystemHealth,
      30000
    );

    return () => clearInterval(interval);
  }, []);

  /*
   * ---------------------------------------------------------
   * SAVE SETTINGS
   * ---------------------------------------------------------
   */

  const handleSaveSettings = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setSavingSettings(true);
      setError('');
      setSavedSuccess(false);

      const response = await fetch(
        `${apiHost}/api/settings`,
        {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({
            synthetic_threshold: syntheticThreshold,
            speaker_match_threshold: mismatchThreshold,
            urgency_weight: urgencyWeight,
          }),
        }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.detail ||
            `Failed to save settings (${response.status})`
        );
      }

      setSavedSuccess(true);

      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Settings save error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save configuration settings.'
      );
    } finally {
      setSavingSettings(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * CHANGE PASSWORD
   * ---------------------------------------------------------
   */

  const handlePasswordChange = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setPasswordError('');
    setPwdSuccess(false);

    if (!oldPassword || !newPassword) {
      setPasswordError(
        'Both current and new passwords are required.'
      );
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        'New password must contain at least 8 characters.'
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch(
        `${apiHost}/api/auth/change-password`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            current_password: oldPassword,
            new_password: newPassword,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Unable to change password.'
        );
      }

      setPwdSuccess(true);

      setOldPassword('');
      setNewPassword('');

      setTimeout(() => {
        setPwdSuccess(false);
      }, 3000);
    } catch (err) {
      console.error(
        'Password change error:',
        err
      );

      setPasswordError(
        err instanceof Error
          ? err.message
          : 'Unable to change password.'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * STATUS HELPERS
   * ---------------------------------------------------------
   */

  const getStatusClass = (
    status:
      | 'checking'
      | 'online'
      | 'offline'
      | 'connected'
  ) => {
    if (status === 'online' || status === 'connected') {
      return 'text-emerald-400';
    }

    if (status === 'offline') {
      return 'text-red-400';
    }

    return 'text-amber-400';
  };

  const getStatusText = (
    status:
      | 'checking'
      | 'online'
      | 'offline'
      | 'connected'
  ) => {
    if (status === 'online') return 'ONLINE';
    if (status === 'connected') return 'CONNECTED';
    if (status === 'offline') return 'OFFLINE';

    return 'CHECKING...';
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="border-b border-[#26334D] pb-4">
        <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />

          <span>
            System Settings & Security Controls
          </span>
        </h1>

        <p className="text-xs text-gray-400 mt-1">
          Configure security thresholds, account security,
          and VIGIL infrastructure diagnostics.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />

          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* User Account */}
        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-[#26334D] pb-3">
            <User className="w-4 h-4 text-blue-400" />

            <span>Active User Profile</span>
          </h3>

          <div className="bg-[#192233] p-4 rounded-xl border border-[#26334D] space-y-3 text-xs">
            <div className="flex justify-between items-center gap-4">
              <span className="text-gray-400">
                Username:
              </span>

              <span className="font-bold text-white font-mono truncate">
                {user?.username || 'Authenticated User'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">
                Security Role:
              </span>

              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
                {user?.role || 'ANALYST'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">
                Authentication:
              </span>

              <span className="text-emerald-400 font-mono text-[10px]">
                JWT ACTIVE
              </span>
            </div>
          </div>

          {/* Password */}
          <form
            onSubmit={handlePasswordChange}
            className="space-y-3 pt-2 text-xs"
          >
            <h4 className="font-semibold text-gray-300 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-gray-400" />

              <span>Update Password</span>
            </h4>

            <div>
              <label className="block text-gray-400 mb-1">
                Current Password
              </label>

              <input
                type="password"
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) =>
                  setOldPassword(e.target.value)
                }
                className="w-full bg-[#192233] border border-[#26334D] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                New Password
              </label>

              <input
                type="password"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                className="w-full bg-[#192233] border border-[#26334D] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {passwordError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />

                <span>{passwordError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full bg-[#192233] hover:bg-[#26334D] disabled:opacity-50 text-gray-200 border border-[#26334D] font-semibold py-2 rounded-lg transition-colors text-xs flex items-center justify-center gap-2"
            >
              {changingPassword ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Update Password
                </>
              )}
            </button>

            {pwdSuccess && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />

                <span>
                  Password updated successfully!
                </span>
              </div>
            )}
          </form>
        </div>

        {/* Risk Controls */}
        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-[#26334D] pb-3">
            <Sliders className="w-4 h-4 text-emerald-400" />

            <span>AI Risk Engine Thresholds</span>
          </h3>

          {loadingSettings ? (
            <div className="flex items-center justify-center py-12 text-gray-500 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />

              Loading saved configuration...
            </div>
          ) : (
            <form
              onSubmit={handleSaveSettings}
              className="space-y-4 text-xs"
            >
              {/* Synthetic */}
              <div>
                <div className="flex justify-between mb-1.5 gap-3">
                  <label className="text-gray-300 font-medium">
                    Synthetic AI Voice Confidence Cutoff
                  </label>

                  <span className="font-bold text-blue-400 font-mono whitespace-nowrap">
                    {syntheticThreshold}%
                  </span>
                </div>

                <input
                  type="range"
                  min="50"
                  max="90"
                  value={syntheticThreshold}
                  onChange={(e) =>
                    setSyntheticThreshold(
                      Number(e.target.value)
                    )
                  }
                  className="w-full accent-blue-500 cursor-pointer"
                />

                <p className="text-[10px] text-gray-500 mt-1">
                  Synthetic probability above this threshold
                  triggers the configured synthetic-voice
                  classification.
                </p>
              </div>

              {/* Speaker */}
              <div>
                <div className="flex justify-between mb-1.5 gap-3">
                  <label className="text-gray-300 font-medium">
                    Speaker Biometric Cosine Match Cutoff
                  </label>

                  <span className="font-bold text-emerald-400 font-mono whitespace-nowrap">
                    {mismatchThreshold}%
                  </span>
                </div>

                <input
                  type="range"
                  min="50"
                  max="90"
                  value={mismatchThreshold}
                  onChange={(e) =>
                    setMismatchThreshold(
                      Number(e.target.value)
                    )
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />

                <p className="text-[10px] text-gray-500 mt-1">
                  Similarity below this threshold can flag a
                  speaker identity mismatch.
                </p>
              </div>

              {/* Urgency */}
              <div>
                <div className="flex justify-between mb-1.5 gap-3">
                  <label className="text-gray-300 font-medium">
                    Urgency & Secrecy Signal Weight
                  </label>

                  <span className="font-bold text-amber-400 font-mono whitespace-nowrap">
                    {urgencyWeight} pts
                  </span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="30"
                  value={urgencyWeight}
                  onChange={(e) =>
                    setUrgencyWeight(
                      Number(e.target.value)
                    )
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />

                <p className="text-[10px] text-gray-500 mt-1">
                  Weight applied to high-pressure urgency and
                  secrecy signals.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-600/30 text-xs flex items-center justify-center gap-2"
              >
                {savingSettings ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />

                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />

                    Save Configuration Settings
                  </>
                )}
              </button>

              {savedSuccess && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />

                  <span>
                    Configuration parameters saved!
                  </span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Infrastructure */}
        <div className="lg:col-span-2 bg-[#121824] border border-[#26334D] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#26334D] pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-purple-400" />

              <span>
                Infrastructure & Deployment Diagnostics
              </span>
            </h3>

            <button
              onClick={checkSystemHealth}
              className="text-gray-400 hover:text-white"
              title="Refresh health"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Backend */}
            <div className="bg-[#192233] p-3 rounded-lg border border-[#26334D]">
              <span className="text-gray-400 block text-[10px] uppercase font-mono">
                Backend API Target
              </span>

              <span className="text-white font-bold font-mono text-xs truncate block mt-1">
                {apiHost}
              </span>

              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    backendStatus === 'online'
                      ? 'bg-emerald-400'
                      : backendStatus === 'offline'
                      ? 'bg-red-400'
                      : 'bg-amber-400'
                  }`}
                />

                <span
                  className={`font-mono text-[10px] ${getStatusClass(
                    backendStatus
                  )}`}
                >
                  {getStatusText(backendStatus)}
                </span>
              </div>
            </div>

            {/* WebSocket */}
            <div className="bg-[#192233] p-3 rounded-lg border border-[#26334D]">
              <span className="text-gray-400 block text-[10px] uppercase font-mono">
                WebSocket Gateway
              </span>

              <span className="text-white font-bold font-mono text-xs block mt-1 truncate">
                wss://vigil-backend-bbwj.onrender.com/ws
              </span>

              <div className="flex items-center gap-1.5 mt-2">
                <Server className="w-3 h-3 text-blue-400" />

                <span className="text-blue-400 font-mono text-[10px]">
                  LIVE GATEWAY
                </span>
              </div>
            </div>

            {/* Database */}
            <div className="bg-[#192233] p-3 rounded-lg border border-[#26334D]">
              <span className="text-gray-400 block text-[10px] uppercase font-mono">
                Database Layer
              </span>

              <span className="text-white font-bold font-mono text-xs block mt-1">
                PostgreSQL / SQLAlchemy
              </span>

              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    databaseStatus === 'connected'
                      ? 'bg-emerald-400'
                      : databaseStatus === 'offline'
                      ? 'bg-red-400'
                      : 'bg-amber-400'
                  }`}
                />

                <span
                  className={`font-mono text-[10px] ${getStatusClass(
                    databaseStatus
                  )}`}
                >
                  {getStatusText(databaseStatus)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
