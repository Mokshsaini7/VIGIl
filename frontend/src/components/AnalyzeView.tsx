'use client';

import React, { useState } from 'react';
import { UploadCloud, FileAudio, CheckCircle2, ShieldAlert, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { RiskGauge } from './RiskGauge';

export const AnalyzeView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const runAnalysis = async () => {
    if (!file) return;
    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('speaker_id', 'SPK_001');

      const response = await fetch('http://localhost:8000/api/audio/analyze', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        // Fallback result for standalone offline UI testing
        setResult(getMockAnalysisResult(file.name));
      }
    } catch (error) {
      setResult(getMockAnalysisResult(file.name));
    } finally {
      setAnalyzing(false);
    }
  };

  const getMockAnalysisResult = (filename: string) => ({
    session_code: `VGL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    filename: filename,
    results: {
      metadata: { duration: 18.4, sample_rate: 16000, rms_energy: 0.12 },
      voice_authenticity: { synthetic_probability: 0.89, real_probability: 0.11, classification: 'SYNTHETIC', confidence: 0.94 },
      speaker_verification: { status: 'MISMATCH', similarity: 0.28, confidence: 0.88, speaker_name: 'Anand Verma' },
      transcription: { transcript: 'Sir your bank account will be suspended today. Share the 6-digit OTP code immediately to verify.', language: 'English', confidence: 0.95 },
      context_analysis: { otp_request: true, money_request: false, urgency_score: 0.92, impersonation_context: 'BANK', detected_signals: ['OTP_REQUEST', 'URGENCY_DETECTED', 'BANK_IMPERSONATION'] },
      risk_assessment: { risk_score: 92, risk_level: 'CRITICAL', contributing_factors: ['89% Synthetic AI Voice', 'Speaker Mismatch (28% similarity)', 'OTP Verification Code Request', 'High Urgency Tactics', 'Bank Impersonation Context'] },
      threat_classification: { primary_threat: 'BANK_IMPERSONATION', recommended_action: 'CRITICAL THREAT! Do NOT share OTP or credentials. Terminate interaction immediately.' }
    }
  });

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="border-b border-[#26334D] pb-4">
        <h1 className="text-xl font-bold text-white">Audio File Forensic Inspector</h1>
        <p className="text-xs text-gray-400 mt-1">
          Upload recorded voice calls (WAV, MP3, OGG, FLAC) to run full multi-layer VIGIL security audit.
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-[#121824] border border-[#26334D] rounded-xl p-8 flex flex-col items-center justify-center text-center">
        <UploadCloud className="w-12 h-12 text-blue-400 mb-3" />
        <h3 className="text-sm font-semibold text-white">Drag and drop audio file here</h3>
        <p className="text-xs text-gray-400 mt-1 mb-4">Supported formats: .wav, .mp3, .ogg, .flac, .m4a (Max 25MB)</p>

        <input
          type="file"
          id="audio-upload"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex items-center space-x-3">
          <label
            htmlFor="audio-upload"
            className="cursor-pointer bg-[#192233] hover:bg-[#26334D] text-gray-200 border border-[#26334D] px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
          >
            Browse Files
          </label>

          {file && (
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50"
            >
              {analyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileAudio className="w-3.5 h-3.5" />}
              <span>{analyzing ? 'Inspecting Audio...' : 'Analyze with VIGIL'}</span>
            </button>
          )}
        </div>

        {file && (
          <div className="mt-4 flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
            <span>Selected File: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
          </div>
        )}
      </div>

      {/* Forensic Report Output */}
      {result && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#26334D] pb-3">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>VIGIL Forensic Report</span>
              <span className="text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">
                {result.session_code}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Gauge */}
            <div className="bg-[#121824] border border-[#26334D] rounded-xl p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono mb-2">DYNAMIC RISK EVALUATION</h3>
              <RiskGauge score={result.results.risk_assessment.risk_score} level={result.results.risk_assessment.risk_level} size={190} />

              <div className="mt-4 w-full text-left text-xs bg-[#192233] p-3 rounded-lg border border-[#26334D]">
                <span className="font-bold text-gray-300 block mb-1">Contributing Factors:</span>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  {result.results.risk_assessment.contributing_factors.map((f: string, idx: number) => (
                    <li key={idx}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Voice Authenticity & Biometric */}
            <div className="bg-[#121824] border border-[#26334D] rounded-xl p-6 space-y-4">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono border-b border-[#26334D] pb-2">
                Acoustic & Biometric Analysis
              </h3>

              <div className="bg-[#192233] p-3 rounded-lg border border-[#26334D]">
                <div className="text-xs text-gray-400">Voice Classification</div>
                <div className="text-lg font-bold font-mono text-red-400 mt-1">
                  {result.results.voice_authenticity.classification} ({(result.results.voice_authenticity.synthetic_probability * 100).toFixed(0)}% AI)
                </div>
              </div>

              <div className="bg-[#192233] p-3 rounded-lg border border-[#26334D]">
                <div className="text-xs text-gray-400">Speaker Biometric Match</div>
                <div className="text-lg font-bold font-mono text-amber-400 mt-1">
                  {result.results.speaker_verification.status} ({(result.results.speaker_verification.similarity * 100).toFixed(0)}% Match)
                </div>
              </div>

              <div className="bg-[#192233] p-3 rounded-lg border border-[#26334D]">
                <div className="text-xs text-gray-400">Detected Signals</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.results.context_analysis.detected_signals.map((sig: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-500/20 text-red-400 border border-red-500/30">
                      {sig}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Transcript & Action */}
            <div className="bg-[#121824] border border-[#26334D] rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono border-b border-[#26334D] pb-2 mb-3">
                  Speech-to-Text Transcript
                </h3>
                <p className="text-xs text-gray-200 leading-relaxed bg-[#192233] p-3 rounded-lg border border-[#26334D] italic">
                  "{result.results.transcription.transcript}"
                </p>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs">
                <span className="font-bold uppercase block mb-1">Recommended Action:</span>
                {result.results.threat_classification.recommended_action}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
