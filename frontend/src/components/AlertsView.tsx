'use client';

import React, { useState } from 'react';
import { Bell, ShieldAlert, CheckCircle2, Filter } from 'lucide-react';

export const AlertsView: React.FC = () => {
  const [alerts, setAlerts] = useState([
    { id: 1, session: 'VGL-8F29A1', severity: 'CRITICAL', title: 'Bank Impersonation Detected in Session VGL-8F29A1', desc: 'Risk Score: 94/100. Factors: 89% Synthetic Voice, Speaker Mismatch, OTP Request.', status: 'NEW', time: '2 mins ago' },
    { id: 2, session: 'VGL-74B01E', severity: 'HIGH', title: 'AI Voice Clone Detected in Session VGL-74B01E', desc: 'Risk Score: 78/100. Factors: 94% Synthetic Voice, Unverified Speaker.', status: 'NEW', time: '14 mins ago' },
    { id: 3, session: 'VGL-63C92D', severity: 'MODERATE', title: 'Speaker Identity Mismatch in Session VGL-63C92D', desc: 'Risk Score: 52/100. Factors: Speaker Mismatch (42% similarity).', status: 'ACKNOWLEDGED', time: '45 mins ago' }
  ]);

  const [filter, setFilter] = useState('ALL');

  const acknowledgeAlert = (id: number) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a));
  };

  const filteredAlerts = alerts.filter(a => filter === 'ALL' || a.status === filter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[#26334D] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Bell className="w-5 h-5 text-red-400" />
            <span>Security Operations Alert Center</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Real-time alert triage and threat acknowledgment portal.</p>
        </div>

        <div className="flex items-center space-x-2 bg-[#121824] p-1.5 rounded-lg border border-[#26334D]">
          <Filter className="w-3.5 h-3.5 text-gray-400 ml-2" />
          {['ALL', 'NEW', 'ACKNOWLEDGED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                filter === f ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div key={alert.id} className="bg-[#121824] border border-[#26334D] rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-xl ${
                alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                alert.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {alert.severity}
                  </span>
                  <span className="text-xs font-mono text-blue-400 font-bold">{alert.session}</span>
                  <span className="text-[10px] text-gray-500">• {alert.time}</span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1">{alert.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{alert.desc}</p>
              </div>
            </div>

            <div>
              {alert.status === 'NEW' ? (
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-600/30"
                >
                  Acknowledge
                </button>
              ) : (
                <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> ACKNOWLEDGED
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
