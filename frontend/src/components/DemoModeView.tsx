'use client';

import React, { useState } from 'react';
import { PlayCircle, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { RiskGauge } from './RiskGauge';

export const DemoModeView: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [demoResult, setDemoResult] = useState<any>(null);

  const scenarios = [
    {
      id: 'demo_1_genuine',
      title: 'Demo 1: Genuine Customer Call',
      badge: 'LOW RISK',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      description: 'Legitimate human voice call with enrolled speaker baseline profile match. Zero fraud indicators.',
      expectedScore: 12
    },
    {
      id: 'demo_2_ai_voice',
      title: 'Demo 2: AI Voice Clone Attack',
      badge: 'HIGH RISK',
      badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      description: 'Synthetic neural vocoder audio clone detected with high acoustic artifact probability (94%).',
      expectedScore: 78
    },
    {
      id: 'demo_3_bank_scam',
      title: 'Demo 3: Bank Impersonation & OTP Theft',
      badge: 'CRITICAL RISK',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
      description: 'Fake bank manager claiming account suspension, demanding immediate 6-digit OTP verification code.',
      expectedScore: 94
    },
    {
      id: 'demo_4_family_emergency',
      title: 'Demo 4: Family Emergency Scam',
      badge: 'CRITICAL RISK',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
      description: 'AI voice clone of family member claiming urgent hospital accident and requesting Rs 50,000 transfer.',
      expectedScore: 96
    },
    {
      id: 'demo_5_financial_fraud',
      title: 'Demo 5: Remote Access & Financial Fraud',
      badge: 'CRITICAL RISK',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
      description: 'Scammer instructing victim to download AnyDesk app and enter UPI PIN for refund authorization.',
      expectedScore: 98
    }
  ];

  const runScenario = async (scenarioId: string) => {
    setActiveScenario(scenarioId);
    setSimulating(true);

    try {
      const response = await fetch(`http://localhost:8000/api/demo/simulate/${scenarioId}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setDemoResult(data);
      } else {
        setDemoResult(getFallbackDemoData(scenarioId));
      }
    } catch (e) {
      setDemoResult(getFallbackDemoData(scenarioId));
    } finally {
      setSimulating(false);
    }
  };

  const getFallbackDemoData = (id: string) => {
    const scMap: Record<string, any> = {
      demo_1_genuine: {
        session_code: 'VGL-DEMO-GENUINE',
        scenario: {
          name: 'Scenario 1: Genuine Customer Call',
          synthetic_probability: 0.08,
          speaker_similarity: 0.94,
          speaker_status: 'MATCH',
          transcript: 'Hello, I am calling to inquire about my credit card rewards balance update for this month.',
          risk_score: 12,
          risk_level: 'LOW',
          threat: 'SAFE',
          action: 'Conversation appears normal. Continue with standard caution.'
        }
      },
      demo_3_bank_scam: {
        session_code: 'VGL-DEMO-BANKSCAM',
        scenario: {
          name: 'Scenario 3: Bank Impersonation & OTP Theft',
          synthetic_probability: 0.88,
          speaker_similarity: 0.22,
          speaker_status: 'MISMATCH',
          transcript: 'Sir your bank account has been blocked today immediately! Read out the 6-digit OTP code sent to your phone right now to stop legal action.',
          risk_score: 94,
          risk_level: 'CRITICAL',
          threat: 'BANK_IMPERSONATION',
          action: 'CRITICAL THREAT! Do NOT share OTP or credentials. Terminate the interaction immediately!'
        }
      }
    };
    return scMap[id] || scMap['demo_3_bank_scam'];
  };

  return (
    <div className="p-6 space-y-6">
      {/* SIH Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-bold font-mono rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
              SMART INDIA HACKATHON 2026
            </span>
            <h1 className="text-lg font-bold text-white">SIH Interactive Demonstration Suite</h1>
          </div>
          <p className="text-xs text-gray-300 mt-1">
            Reproducible 3-5 minute live demonstration scenarios designed for SIH jury evaluation.
          </p>
        </div>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((sc) => (
          <div key={sc.id} className="bg-[#121824] border border-[#26334D] rounded-xl p-5 flex flex-col justify-between hover:border-blue-500/50 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded border ${sc.badgeColor}`}>
                  {sc.badge}
                </span>
                <span className="text-xs font-mono text-gray-400">Score: {sc.expectedScore}/100</span>
              </div>
              <h3 className="text-sm font-bold text-white">{sc.title}</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">{sc.description}</p>
            </div>

            <button
              onClick={() => runScenario(sc.id)}
              disabled={simulating && activeScenario === sc.id}
              className="mt-4 w-full bg-[#192233] hover:bg-blue-600 hover:text-white text-blue-400 border border-[#26334D] py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              {simulating && activeScenario === sc.id ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <PlayCircle className="w-4 h-4" />
              )}
              <span>{simulating && activeScenario === sc.id ? 'Simulating Pipeline...' : 'Run Scenario'}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Live Simulation Output Box */}
      {demoResult && (
        <div className="bg-[#121824] border border-[#26334D] rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#26334D] pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Live Simulation: {demoResult.scenario.name}</span>
              </h2>
              <span className="text-xs font-mono text-gray-400">Session ID: {demoResult.session_code}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex flex-col items-center justify-center bg-[#192233] p-6 rounded-xl border border-[#26334D]">
              <RiskGauge score={demoResult.scenario.risk_score} level={demoResult.scenario.risk_level} size={190} />
            </div>

            <div className="bg-[#192233] p-5 rounded-xl border border-[#26334D] space-y-3">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono border-b border-[#26334D] pb-2">
                Acoustic & Biometric Signals
              </h3>
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">AI Voice Probability:</span>
                  <span className="font-bold text-red-400 font-mono">{(demoResult.scenario.synthetic_probability * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Biometric Similarity:</span>
                  <span className="font-bold text-amber-400 font-mono">{(demoResult.scenario.speaker_similarity * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Speaker Status:</span>
                  <span className="font-bold text-white">{demoResult.scenario.speaker_status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Threat Category:</span>
                  <span className="font-bold text-red-400 font-mono">{demoResult.scenario.threat}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#192233] p-5 rounded-xl border border-[#26334D] flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono border-b border-[#26334D] pb-2 mb-2">
                  Live Transcript
                </h3>
                <p className="text-xs text-gray-200 leading-relaxed italic">
                  "{demoResult.scenario.transcript}"
                </p>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                <span className="font-bold uppercase block mb-1">SIH Advisory:</span>
                {demoResult.scenario.action}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
