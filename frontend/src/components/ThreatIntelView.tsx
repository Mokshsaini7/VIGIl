'use client';

import React from 'react';
import { ShieldCheck, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const ThreatIntelView: React.FC = () => {
  const attackData = [
    { vector: 'Bank Impersonation', count: 48 },
    { vector: 'OTP Theft', count: 36 },
    { vector: 'AI Voice Cloning', count: 28 },
    { vector: 'Family Emergency', count: 19 },
    { vector: 'Remote Access Scam', count: 14 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-[#26334D] pb-4">
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Threat Intelligence & Cyber Analytics</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">Aggregated attack vectors and voice impersonation patterns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono mb-4">
            Voice Threat Frequency by Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attackData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#26334D" />
                <XAxis dataKey="vector" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#192233', borderColor: '#26334D' }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono border-b border-[#26334D] pb-2">
            Top Detected Impersonation Vectors
          </h3>

          <div className="space-y-3 text-xs">
            <div className="bg-[#192233] p-3 rounded-lg border border-[#26334D] flex justify-between items-center">
              <div>
                <div className="font-bold text-white">Bank Account Suspension Scam</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Vector: Banking & Financial OTP Harvest</div>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded bg-red-500/20 text-red-400">HIGH FREQUENCY</span>
            </div>

            <div className="bg-[#192233] p-3 rounded-lg border border-[#26334D] flex justify-between items-center">
              <div>
                <div className="font-bold text-white">Family Distress Voice Clone</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Vector: Emotional Urgency & Cash Transfer</div>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded bg-orange-500/20 text-orange-400">EMERGING VEC</span>
            </div>

            <div className="bg-[#192233] p-3 rounded-lg border border-[#26334D] flex justify-between items-center">
              <div>
                <div className="font-bold text-white">Remote Access AnyDesk Scam</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Vector: Credential & Screen Control Harvest</div>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded bg-amber-500/20 text-amber-400">CRITICAL TARGET</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
