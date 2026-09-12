'use client';

import React, { useState } from 'react';
import { History, Search, FileText } from 'lucide-react';

export const SessionsView: React.FC = () => {
  const [sessions] = useState([
    { code: 'VGL-8F29A1', duration: '18.4s', synth: '89%', speaker: 'MISMATCH', risk: 94, level: 'CRITICAL', threat: 'BANK_IMPERSONATION', time: '2026-09-12 11:42' },
    { code: 'VGL-74B01E', duration: '24.1s', synth: '94%', speaker: 'UNKNOWN', risk: 78, level: 'HIGH', threat: 'VOICE_CLONING', time: '2026-09-12 11:15' },
    { code: 'VGL-63C92D', duration: '45.0s', synth: '12%', speaker: 'MATCH', risk: 12, level: 'LOW', threat: 'SAFE', time: '2026-09-12 10:30' }
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[#26334D] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-400" />
            <span>Analysis Session History & Forensic Archive</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Audit log of historical voice security inspections.</p>
        </div>

        <div className="flex items-center space-x-2 bg-[#121824] px-3 py-1.5 rounded-lg border border-[#26334D]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search Session ID..."
            className="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-[#121824] border border-[#26334D] rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#192233] text-gray-400 uppercase tracking-wider font-mono border-b border-[#26334D]">
            <tr>
              <th className="p-3.5">Session Code</th>
              <th className="p-3.5">Duration</th>
              <th className="p-3.5">AI Voice %</th>
              <th className="p-3.5">Speaker Match</th>
              <th className="p-3.5">Risk Score</th>
              <th className="p-3.5">Threat Category</th>
              <th className="p-3.5">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#26334D]">
            {sessions.map((s) => (
              <tr key={s.code} className="hover:bg-[#192233]/50 transition-colors">
                <td className="p-3.5 font-mono font-bold text-blue-400">{s.code}</td>
                <td className="p-3.5 text-gray-300">{s.duration}</td>
                <td className="p-3.5 text-gray-300 font-mono">{s.synth}</td>
                <td className="p-3.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    s.speaker === 'MATCH' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {s.speaker}
                  </span>
                </td>
                <td className="p-3.5 font-bold font-mono text-red-400">{s.risk}/100</td>
                <td className="p-3.5 text-gray-200">{s.threat}</td>
                <td className="p-3.5 text-gray-500 font-mono">{s.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
