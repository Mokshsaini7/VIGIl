'use client';

import React from 'react';
import { ShieldAlert, Activity, UserCheck, AlertTriangle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { RiskGauge } from './RiskGauge';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

interface OverviewViewProps {
  onNavigate: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const threatData = [
    { name: 'Safe', value: 42, color: '#10B981' },
    { name: 'Suspicious', value: 24, color: '#F59E0B' },
    { name: 'AI Voice Clone', value: 18, color: '#EF4444' },
    { name: 'Bank Impersonation', value: 12, color: '#DC2626' },
    { name: 'Financial Fraud', value: 4, color: '#8B5CF6' }
  ];

  const recentAlerts = [
    { id: 1, session: 'VGL-8F29A1', type: 'BANK_IMPERSONATION', risk: 94, level: 'CRITICAL', time: '2 mins ago' },
    { id: 2, session: 'VGL-74B01E', type: 'VOICE_CLONING', risk: 78, level: 'HIGH', time: '14 mins ago' },
    { id: 3, session: 'VGL-63C92D', type: 'SPEAKER_MISMATCH', risk: 52, level: 'MODERATE', time: '45 mins ago' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome & System Banner */}
      <div className="bg-[#121824] border border-[#26334D] rounded-xl p-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            Voice Security Intelligence Center
            <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              ● All Systems Operational
            </span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time AI synthetic voice detection, biometric speaker verification & dynamic threat scoring.
          </p>
        </div>
        <button
          onClick={() => onNavigate('demo-mode')}
          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 transition-all shadow-lg shadow-amber-500/10"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Launch SIH Demo Suite</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 font-medium">Active Sessions</div>
            <div className="text-2xl font-extrabold text-white mt-1">128</div>
            <div className="text-[11px] text-emerald-400 flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +14% vs yesterday
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 font-medium">Threats Detected</div>
            <div className="text-2xl font-extrabold text-red-400 mt-1">34</div>
            <div className="text-[11px] text-red-400 flex items-center mt-1">
              <AlertTriangle className="w-3 h-3 mr-0.5" /> 8 Critical events
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 font-medium">High Risk Rate</div>
            <div className="text-2xl font-extrabold text-amber-400 mt-1">14.2%</div>
            <div className="text-[11px] text-gray-400 mt-1">Avg Risk Score: 28</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 font-medium">Enrolled Speakers</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">1,042</div>
            <div className="text-[11px] text-emerald-400 flex items-center mt-1">
              <CheckCircle2 className="w-3 h-3 mr-0.5" /> Biometric DB ready
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Dashboard Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Risk Panel */}
        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider font-mono">Current Live Risk Index</h3>
          <RiskGauge score={72} level="HIGH" size={200} />
          <p className="text-xs text-gray-400 mt-4 max-w-xs">
            Multi-signal fusion score combining AI voice probability (88%), speaker mismatch, and OTP harvest signals.
          </p>
          <button
            onClick={() => onNavigate('live-monitor')}
            className="mt-5 w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-600/30"
          >
            Open Live Monitor
          </button>
        </div>

        {/* Threat Distribution Chart */}
        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-5 flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider font-mono mb-2">Threat Vector Breakdown</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={threatData} innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {threatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#192233', borderColor: '#26334D', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {threatData.map((t, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }}></span>
                <span className="text-gray-400">{t.name}:</span>
                <span className="font-semibold text-white">{t.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts Feed */}
        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider font-mono">Recent High-Risk Alerts</h3>
            <button onClick={() => onNavigate('alerts')} className="text-xs text-blue-400 hover:underline">View All</button>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="p-3 rounded-lg bg-[#192233] border border-[#26334D] flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      alert.level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                      alert.level === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}>
                      {alert.level}
                    </span>
                    <span className="text-xs font-mono font-semibold text-white">{alert.session}</span>
                  </div>
                  <div className="text-xs text-gray-300 mt-1">{alert.type.replace('_', ' ')}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-red-400 font-mono">{alert.risk}/100</div>
                  <div className="text-[10px] text-gray-500">{alert.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
