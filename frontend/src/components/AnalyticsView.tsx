'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Activity,
  ShieldAlert,
  UserCheck,
  Zap,
  AlertTriangle,
  RefreshCw,
  Database,
} from 'lucide-react';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

interface AnalyticsViewProps {
  user?: {
    username: string;
    role: string;
    token: string;
  } | null;
}

interface Session {
  session_code?: string;
  risk_score?: number;
  voice_classification?: string;
  synthetic_probability?: number;
  speaker_status?: string;
  primary_threat?: string;
  created_at?: string;
  timestamp?: string;
}

interface Alert {
  title?: string;
  description?: string;
  severity?: string;
  threat_type?: string;
  created_at?: string;
}

interface Speaker {
  speaker_id?: string;
  name?: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ user }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const apiHost =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const getToken = () => {
    if (user?.token) return user.token;

    if (typeof window !== 'undefined') {
      return localStorage.getItem('vigil_token') || '';
    }

    return '';
  };

  const fetchJSON = async (url: string) => {
    const token = getToken();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
  };

  const loadAnalytics = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const [sessionData, alertData, speakerData] =
        await Promise.all([
          fetchJSON(`${apiHost}/api/sessions`),
          fetchJSON(`${apiHost}/api/alerts`),
          fetchJSON(`${apiHost}/api/speaker/profiles`),
        ]);

      setSessions(Array.isArray(sessionData) ? sessionData : []);
      setAlerts(Array.isArray(alertData) ? alertData : []);
      setSpeakers(Array.isArray(speakerData) ? speakerData : []);
    } catch (err) {
      console.error('Analytics loading error:', err);

      setError(
        'Unable to load analytics data. Please check your connection or login session.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();

    const interval = setInterval(() => {
      loadAnalytics(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.token]);

  /*
   * ---------------------------------------------------------
   * REAL ANALYTICS
   * ---------------------------------------------------------
   */

  const totalSessions = sessions.length;

  const syntheticSessions = sessions.filter((session) => {
    const classification =
      String(session.voice_classification || '').toUpperCase();

    const probability = Number(
      session.synthetic_probability || 0
    );

    return (
      classification === 'SYNTHETIC' ||
      probability >= 0.6
    );
  });

  const synthCount = syntheticSessions.length;

  const realCount = Math.max(
    0,
    totalSessions - synthCount
  );

  const synthPercent =
    totalSessions > 0
      ? ((synthCount / totalSessions) * 100).toFixed(1)
      : '0.0';

  /*
   * Speaker MATCH only.
   *
   * NOT_ENROLLED is deliberately excluded because
   * absence of an enrolled speaker is not a mismatch.
   */
  const enrolledMatchSessions = sessions.filter((session) => {
    const status = String(
      session.speaker_status || ''
    ).toUpperCase();

    return status === 'MATCH';
  });

  const verifiedSpeakerSessions = sessions.filter((session) => {
    const status = String(
      session.speaker_status || ''
    ).toUpperCase();

    return (
      status === 'MATCH' ||
      status === 'MISMATCH'
    );
  });

  const matchPercent =
    verifiedSpeakerSessions.length > 0
      ? (
          (enrolledMatchSessions.length /
            verifiedSpeakerSessions.length) *
          100
        ).toFixed(1)
      : '0.0';

  const avgRisk =
    totalSessions > 0
      ? Math.round(
          sessions.reduce(
            (sum, session) =>
              sum + Number(session.risk_score || 0),
            0
          ) / totalSessions
        )
      : 0;

  /*
   * ---------------------------------------------------------
   * VOICE DISTRIBUTION
   * ---------------------------------------------------------
   */

  const voiceDistribution = useMemo(
    () => [
      {
        name: 'Real Human Voice',
        value: realCount,
        color: '#10B981',
      },
      {
        name: 'Synthetic / AI Voice',
        value: synthCount,
        color: '#EF4444',
      },
    ],
    [realCount, synthCount]
  );

  /*
   * ---------------------------------------------------------
   * THREAT DATA
   * ---------------------------------------------------------
   */

  const threatData = useMemo(() => {
    const bankCount = alerts.filter((alert) => {
      const text = `${alert.title || ''} ${
        alert.description || ''
      } ${alert.threat_type || ''}`.toUpperCase();

      return (
        text.includes('BANK') ||
        text.includes('BANK_IMPERSONATION')
      );
    }).length;

    const voiceCloneCount = alerts.filter((alert) => {
      const text = `${alert.title || ''} ${
        alert.description || ''
      } ${alert.threat_type || ''}`.toUpperCase();

      return (
        text.includes('VOICE') ||
        text.includes('CLON')
      );
    }).length;

    const otpCount = alerts.filter((alert) => {
      const text = `${alert.title || ''} ${
        alert.description || ''
      } ${alert.threat_type || ''}`.toUpperCase();

      return text.includes('OTP');
    }).length;

    const financialCount = sessions.filter((session) => {
      return (
        String(session.primary_threat || '').toUpperCase() ===
        'FINANCIAL_FRAUD'
      );
    }).length;

    return [
      {
        category: 'Bank Impersonation',
        count: bankCount,
      },
      {
        category: 'Voice Cloning',
        count: voiceCloneCount,
      },
      {
        category: 'OTP Scam',
        count: otpCount,
      },
      {
        category: 'Financial Fraud',
        count: financialCount,
      },
    ];
  }, [alerts, sessions]);

  /*
   * ---------------------------------------------------------
   * RISK TREND
   * ---------------------------------------------------------
   */

  const trendData = useMemo(() => {
    return [...sessions]
      .slice(-10)
      .map((session, index) => ({
        time:
          session.created_at ||
          session.timestamp
            ? new Date(
                session.created_at ||
                  session.timestamp ||
                  ''
              ).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : `Session ${index + 1}`,

        risk: Number(session.risk_score || 0),
      }));
  }, [sessions]);

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="p-4 sm:p-6 w-full min-w-0">
        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-4" />

          <p className="text-white font-semibold">
            Loading system analytics...
          </p>

          <p className="text-gray-500 text-xs mt-2">
            Fetching live VIGIL telemetry
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="border-b border-[#26334D] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />

            <span>
              System Analytics & Real-Time Intelligence
            </span>
          </h1>

          <p className="text-xs text-gray-400 mt-1">
            Aggregated security telemetry calculated directly
            from your VIGIL sessions and threat logs.
          </p>
        </div>

        <button
          onClick={() => loadAnalytics(true)}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#26334D] bg-[#121824] hover:bg-[#192233] text-gray-300 text-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              refreshing ? 'animate-spin' : ''
            }`}
          />

          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-red-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />

          <span>{error}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Sessions */}
        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 font-medium">
              Total Sessions Audited
            </div>

            <div className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {totalSessions}
            </div>

            <div className="text-[11px] text-emerald-400 flex items-center mt-1">
              <Activity className="w-3 h-3 mr-1" />
              Live telemetry
            </div>
          </div>

          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Synthetic */}
        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 font-medium">
              Synthetic AI Voice Rate
            </div>

            <div className="text-xl sm:text-2xl font-extrabold text-red-400 mt-1">
              {synthPercent}%
            </div>

            <div className="text-[11px] text-red-400 flex items-center mt-1">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {synthCount} flagged
            </div>
          </div>

          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Speaker */}
        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 font-medium">
              Speaker Match Rate
            </div>

            <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1">
              {matchPercent}%
            </div>

            <div className="text-[11px] text-gray-400 mt-1">
              {speakers.length} enrolled profiles
            </div>
          </div>

          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Risk */}
        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 font-medium">
              Average Risk Score
            </div>

            <div className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-1">
              {avgRisk}

              <span className="text-xs text-gray-400 font-normal">
                {' '}
                / 100
              </span>
            </div>

            <div className="text-[11px] text-gray-400 mt-1">
              Calculated from sessions
            </div>
          </div>

          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Empty State */}
      {totalSessions === 0 && (
        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-6 text-center">
          <Database className="w-8 h-8 text-gray-600 mx-auto mb-3" />

          <h3 className="text-sm font-semibold text-gray-300">
            No analysis telemetry yet
          </h3>

          <p className="text-xs text-gray-500 mt-1">
            Run an audio analysis or live monitoring session
            to populate these analytics.
          </p>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Voice Distribution */}
        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-4 sm:p-5">
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono mb-4">
            Voice Authenticity Ratio
          </h3>

          {totalSessions > 0 ? (
            <>
              <div className="h-52 sm:h-60">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={voiceDistribution}
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {voiceDistribution.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#192233',
                        borderColor: '#26334D',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap justify-center gap-4 text-xs mt-2">
                {voiceDistribution.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-2"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: item.color,
                      }}
                    />

                    <span className="text-gray-300 font-medium">
                      {item.name}:
                    </span>

                    <span className="font-bold text-white">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-52 flex items-center justify-center text-xs text-gray-500">
              No session data available
            </div>
          )}
        </div>

        {/* Threats */}
        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-4 sm:p-5">
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono mb-4">
            Detected Threat Vectors
          </h3>

          <div className="h-52 sm:h-60">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={threatData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#26334D"
                />

                <XAxis
                  dataKey="category"
                  stroke="#9CA3AF"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={55}
                />

                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fontSize: 10 }}
                  allowDecimals={false}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#192233',
                    borderColor: '#26334D',
                  }}
                />

                <Bar
                  dataKey="count"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Risk Trend */}
      <div className="bg-[#121824] border border-[#26334D] rounded-xl p-4 sm:p-5">
        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono mb-4">
          Session Risk Score Trend
        </h3>

        <div className="h-44 sm:h-52">
          {trendData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart data={trendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#26334D"
                />

                <XAxis
                  dataKey="time"
                  stroke="#9CA3AF"
                  tick={{ fontSize: 10 }}
                />

                <YAxis
                  domain={[0, 100]}
                  stroke="#9CA3AF"
                  tick={{ fontSize: 10 }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#192233',
                    borderColor: '#26334D',
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="risk"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-gray-500">
              No risk trend available yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
