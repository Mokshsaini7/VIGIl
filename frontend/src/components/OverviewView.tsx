'use client';

import React from 'react';
import {
  ShieldAlert,
  Activity,
  UserCheck,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { RiskGauge } from './RiskGauge';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

interface OverviewViewProps {
  onNavigate: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
}) => {
  const threatData = [
    { name: 'Safe', value: 42, color: '#10B981' },
    { name: 'Suspicious', value: 24, color: '#F59E0B' },
    { name: 'AI Voice Clone', value: 18, color: '#EF4444' },
    { name: 'Bank Impersonation', value: 12, color: '#DC2626' },
    { name: 'Financial Fraud', value: 4, color: '#8B5CF6' },
  ];

  const recentAlerts = [
    {
      id: 1,
      session: 'VGL-8F29A1',
      type: 'BANK_IMPERSONATION',
      risk: 94,
      level: 'CRITICAL',
      time: '2 mins ago',
    },
    {
      id: 2,
      session: 'VGL-74B01E',
      type: 'VOICE_CLONING',
      risk: 78,
      level: 'HIGH',
      time: '14 mins ago',
    },
    {
      id: 3,
      session: 'VGL-63C92D',
      type: 'SPEAKER_MISMATCH',
      risk: 52,
      level: 'MODERATE',
      time: '45 mins ago',
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-6 p-4 sm:p-5 lg:p-6">

      {/* =====================================================
          WELCOME / SYSTEM BANNER
      ===================================================== */}
      <div className="w-full min-w-0 rounded-xl border border-[#26334D] bg-[#121824] p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* LEFT SIDE */}
          <div className="min-w-0 flex-1">

            {/* TITLE + STATUS */}
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start">

              <h1 className="min-w-0 text-xl font-bold leading-7 text-white sm:text-2xl sm:leading-8">
                Voice Security Intelligence Center
              </h1>

              <span className="inline-flex w-fit max-w-full shrink-0 items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-normal leading-4 text-emerald-400 sm:mt-1 sm:text-xs">
                <span className="mr-1.5">●</span>
                <span>All Systems Operational</span>
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Real-time AI synthetic voice detection, biometric speaker
              verification & dynamic threat scoring.
            </p>
          </div>

          {/* DEMO BUTTON */}
          <div className="w-full shrink-0 lg:w-auto">
            <button
              onClick={() => onNavigate('demo-mode')}
              className="
                flex
                min-h-[46px]
                w-full
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-amber-500/40
                bg-amber-500/10
                px-4
                py-2.5
                text-sm
                font-semibold
                text-amber-400
                shadow-lg
                shadow-amber-500/10
                transition-all
                hover:bg-amber-500/20
                sm:w-auto
              "
            >
              <ShieldAlert className="h-4 w-4 shrink-0" />

              <span className="whitespace-normal text-center sm:whitespace-nowrap">
                Launch SIH Demo Suite
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          METRICS
      ===================================================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* ACTIVE SESSIONS */}
        <div className="flex min-w-0 items-center justify-between rounded-xl border border-[#26334D] bg-[#121824] p-4">
          <div className="min-w-0">
            <div className="text-xs font-medium text-gray-400">
              Active Sessions
            </div>

            <div className="mt-1 text-2xl font-extrabold text-white">
              128
            </div>

            <div className="mt-1 flex items-center text-[11px] text-emerald-400">
              <ArrowUpRight className="mr-0.5 h-3 w-3 shrink-0" />
              <span>+14% vs yesterday</span>
            </div>
          </div>

          <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        {/* THREATS */}
        <div className="flex min-w-0 items-center justify-between rounded-xl border border-[#26334D] bg-[#121824] p-4">
          <div className="min-w-0">
            <div className="text-xs font-medium text-gray-400">
              Threats Detected
            </div>

            <div className="mt-1 text-2xl font-extrabold text-red-400">
              34
            </div>

            <div className="mt-1 flex items-center text-[11px] text-red-400">
              <AlertTriangle className="mr-0.5 h-3 w-3 shrink-0" />
              <span>8 Critical events</span>
            </div>
          </div>

          <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        {/* HIGH RISK */}
        <div className="flex min-w-0 items-center justify-between rounded-xl border border-[#26334D] bg-[#121824] p-4">
          <div className="min-w-0">
            <div className="text-xs font-medium text-gray-400">
              High Risk Rate
            </div>

            <div className="mt-1 text-2xl font-extrabold text-amber-400">
              14.2%
            </div>

            <div className="mt-1 text-[11px] text-gray-400">
              Avg Risk Score: 28
            </div>
          </div>

          <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        {/* ENROLLED SPEAKERS */}
        <div className="flex min-w-0 items-center justify-between rounded-xl border border-[#26334D] bg-[#121824] p-4">
          <div className="min-w-0">
            <div className="text-xs font-medium text-gray-400">
              Enrolled Speakers
            </div>

            <div className="mt-1 text-2xl font-extrabold text-emerald-400">
              1,042
            </div>

            <div className="mt-1 flex items-center text-[11px] text-emerald-400">
              <CheckCircle2 className="mr-0.5 h-3 w-3 shrink-0" />
              <span>Biometric DB ready</span>
            </div>
          </div>

          <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* =====================================================
          MAIN DASHBOARD
      ===================================================== */}
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ===================================================
            LIVE RISK
        =================================================== */}
        <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-[#26334D] bg-[#121824] p-5 text-center sm:p-6">

          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-300 sm:text-sm">
            Current Live Risk Index
          </h3>

          <div className="w-full max-w-[200px]">
            <RiskGauge
              score={72}
              level="HIGH"
              size={200}
            />
          </div>

          <p className="mt-4 max-w-xs text-xs leading-5 text-gray-400">
            Multi-signal fusion score combining AI voice probability
            (88%), speaker mismatch, and OTP harvest signals.
          </p>

          <button
            onClick={() => onNavigate('live-monitor')}
            className="
              mt-5
              min-h-[44px]
              w-full
              rounded-lg
              bg-blue-600
              px-4
              py-2.5
              text-xs
              font-semibold
              text-white
              shadow-lg
              shadow-blue-600/30
              transition-colors
              hover:bg-blue-500
            "
          >
            Open Live Monitor
          </button>
        </div>

        {/* ===================================================
            THREAT DISTRIBUTION
        =================================================== */}
        <div className="flex min-w-0 flex-col rounded-xl border border-[#26334D] bg-[#121824] p-4 sm:p-5">

          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-300 sm:text-sm">
            Threat Vector Breakdown
          </h3>

          <div className="h-48 min-w-0 w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={threatData}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {threatData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                    />
                  ))}
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

          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            {threatData.map((t, idx) => (
              <div
                key={idx}
                className="flex min-w-0 items-center gap-2"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: t.color,
                  }}
                />

                <span className="min-w-0 truncate text-gray-400">
                  {t.name}:
                </span>

                <span className="shrink-0 font-semibold text-white">
                  {t.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ===================================================
            RECENT ALERTS
        =================================================== */}
        <div className="flex min-w-0 flex-col rounded-xl border border-[#26334D] bg-[#121824] p-4 sm:p-5">

          <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
            <h3 className="min-w-0 text-xs font-semibold uppercase tracking-wider text-gray-300 sm:text-sm">
              Recent High-Risk Alerts
            </h3>

            <button
              onClick={() => onNavigate('alerts')}
              className="shrink-0 text-xs text-blue-400 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">

            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="
                  flex
                  min-w-0
                  items-center
                  justify-between
                  gap-3
                  rounded-lg
                  border
                  border-[#26334D]
                  bg-[#192233]
                  p-3
                "
              >
                {/* ALERT INFO */}
                <div className="min-w-0 flex-1">

                  <div className="flex min-w-0 items-center gap-2">

                    <span
                      className={`
                        shrink-0
                        rounded
                        px-2
                        py-0.5
                        text-[9px]
                        font-bold
                        ${
                          alert.level === 'CRITICAL'
                            ? 'border border-red-500/40 bg-red-500/20 text-red-400'
                            : alert.level === 'HIGH'
                            ? 'border border-orange-500/40 bg-orange-500/20 text-orange-400'
                            : 'border border-amber-500/40 bg-amber-500/20 text-amber-400'
                        }
                      `}
                    >
                      {alert.level}
                    </span>

                    <span className="min-w-0 truncate font-mono text-[10px] font-semibold text-white sm:text-xs">
                      {alert.session}
                    </span>
                  </div>

                  <div className="mt-1 truncate text-xs text-gray-300">
                    {alert.type.replace('_', ' ')}
                  </div>
                </div>

                {/* RISK */}
                <div className="shrink-0 text-right">
                  <div className="font-mono text-sm font-bold text-red-400">
                    {alert.risk}/100
                  </div>

                  <div className="text-[10px] text-gray-500">
                    {alert.time}
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
};
