'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, ShieldAlert, Clock, Zap } from 'lucide-react';
import { RiskGauge } from './RiskGauge';
import { AudioWaveform } from './AudioWaveform';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export const LiveMonitorView: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [riskScore, setRiskScore] = useState(12);
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [synthProb, setSynthProb] = useState(0.08);
  const [speakerSimilarity, setSpeakerSimilarity] = useState(0.94);
  const [speakerStatus, setSpeakerStatus] = useState('MATCH');
  const [impersonation, setImpersonation] = useState('NONE');
  const [speakerProfiles, setSpeakerProfiles] = useState<any[]>([]);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('');

  const [transcriptUtterances, setTranscriptUtterances] = useState<Array<{ id: number; speaker: string; text: string; flags?: string[] }>>([
    { id: 1, speaker: 'CALLER', text: 'Hello, this is customer service calling regarding your registered phone number.' }
  ]);

  const [timelineData, setTimelineData] = useState<Array<{ time: string; score: number }>>([
    { time: '00:00', score: 12 }
  ]);

  // Fetch real speaker profiles from backend
  useEffect(() => {
    fetch('http://https://vigil-backend-bbwj.onrender.com/api/speaker/profiles')
      .then(res => res.json())
      .then(data => {
        setSpeakerProfiles(data);
        if (data.length > 0) {
          setSelectedSpeakerId(data[0].speaker_id);
        }
      })
      .catch(() => {});
  }, []);

  // Simulation timer for live monitor playback
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRiskScore(12);
      setRiskLevel('LOW');
      setSynthProb(0.08);
      setSpeakerSimilarity(0.94);
      setSpeakerStatus('MATCH');
      setImpersonation('NONE');
      setTranscriptUtterances([
        { id: 1, speaker: 'CALLER', text: 'Hello, customer verification in progress. Can you hear me clearly?' }
      ]);
      setTimelineData([{ time: '00:00', score: 12 }]);
    } else {
      setIsRecording(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner Control Bar */}
      <div className="bg-[#121824] border border-[#26334D] rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleRecording}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-lg ${
              isRecording
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isRecording ? 'Stop Live Monitor' : 'Start Microphone Monitor'}</span>
          </button>

          <div className="flex items-center space-x-3 text-xs font-mono bg-[#0B0F17] px-3.5 py-2 rounded-lg border border-[#26334D]">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400">Duration:</span>
            <span className="font-bold text-white">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Dynamic Speaker Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400 font-mono">Target Profile:</span>
          {speakerProfiles.length > 0 ? (
            <select
              value={selectedSpeakerId}
              onChange={(e) => setSelectedSpeakerId(e.target.value)}
              className="bg-[#192233] border border-[#26334D] text-xs font-bold text-blue-400 rounded px-2.5 py-1 focus:outline-none"
            >
              {speakerProfiles.map((p) => (
                <option key={p.speaker_id} value={p.speaker_id}>
                  {p.speaker_id} ({p.name})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded">
              No Speaker Enrolled Yet
            </span>
          )}
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Waveform & Signal Cards (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#121824] border border-[#26334D] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">Acoustic Audio Oscilloscope</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isRecording ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}>
                {isRecording ? 'STREAMING' : 'IDLE'}
              </span>
            </div>
            <AudioWaveform isRecording={isRecording} color={riskScore > 60 ? '#EF4444' : '#3B82F6'} />
          </div>

          <div className="bg-[#121824] border border-[#26334D] rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono border-b border-[#26334D] pb-2">
              Voice Authenticity Metrics
            </h3>

            <div className="flex items-center justify-between bg-[#192233] p-3 rounded-lg border border-[#26334D]">
              <div>
                <div className="text-xs text-gray-400">AI Voice Probability</div>
                <div className="text-lg font-bold font-mono text-white">{(synthProb * 100).toFixed(0)}%</div>
              </div>
              <div className={`px-2.5 py-1 text-xs font-bold rounded ${
                synthProb > 0.60 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {synthProb > 0.60 ? 'SYNTHETIC' : 'REAL HUMAN'}
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#192233] p-3 rounded-lg border border-[#26334D]">
              <div>
                <div className="text-xs text-gray-400">Speaker Biometric Match</div>
                <div className="text-lg font-bold font-mono text-white">{(speakerSimilarity * 100).toFixed(0)}%</div>
              </div>
              <div className={`px-2.5 py-1 text-xs font-bold rounded ${
                speakerStatus === 'MATCH' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {speakerStatus}
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#192233] p-3 rounded-lg border border-[#26334D]">
              <div>
                <div className="text-xs text-gray-400">Impersonation Context</div>
                <div className="text-sm font-bold font-mono text-amber-400">{impersonation}</div>
              </div>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Center Column: Live Risk Gauge */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#121824] border border-[#26334D] rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono mb-2">DYNAMIC RISK EVALUATION</h3>
            <RiskGauge score={riskScore} level={riskLevel} size={210} />

            <div className={`mt-6 w-full p-4 rounded-xl border text-left flex items-start space-x-3 ${
              riskLevel === 'CRITICAL' ? 'bg-red-500/10 border-red-500/40 text-red-300' :
              riskLevel === 'HIGH' ? 'bg-orange-500/10 border-orange-500/40 text-orange-300' :
              'bg-blue-500/10 border-blue-500/30 text-blue-300'
            }`}>
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">RECOMMENDED ACTION:</div>
                <div className="text-xs mt-1 leading-relaxed">
                  {riskLevel === 'CRITICAL'
                    ? 'Do NOT share OTP, PIN, credentials or transfer money. Terminate the interaction immediately and independently verify the caller.'
                    : riskLevel === 'HIGH'
                    ? 'Do not share sensitive information. Verify the caller through an independent trusted channel.'
                    : 'Conversation appears normal. Continue with standard security hygiene.'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#121824] border border-[#26334D] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono mb-3">Conversation Risk Timeline</h3>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <XAxis dataKey="time" stroke="#4B5563" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} stroke="#4B5563" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#192233', borderColor: '#26334D' }} />
                  <Line type="monotone" dataKey="score" stroke={riskScore > 60 ? '#EF4444' : '#3B82F6'} strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Live Transcript */}
        <div className="lg:col-span-3 bg-[#121824] border border-[#26334D] rounded-xl p-5 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono border-b border-[#26334D] pb-2 mb-4">
              Live Speech-to-Text Transcript
            </h3>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {transcriptUtterances.map((u) => (
                <div key={u.id} className="bg-[#192233] p-3 rounded-lg border border-[#26334D] space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span className="font-bold text-blue-400">{u.speaker}</span>
                    <span>16kHz Mono</span>
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed font-sans">{u.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
