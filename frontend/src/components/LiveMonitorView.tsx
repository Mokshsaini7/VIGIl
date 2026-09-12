'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  ShieldAlert,
  Clock,
  Zap,
} from 'lucide-react';
import { RiskGauge } from './RiskGauge';
import { AudioWaveform } from './AudioWaveform';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

type TranscriptUtterance = {
  id: number;
  speaker: string;
  text: string;
  flags?: string[];
};

type TimelinePoint = {
  time: string;
  score: number;
};

type AnalysisMessage = {
  type?: string;
  session_id?: string;
  timestamp?: string;
  transcript?: string;

  voice_analysis?: {
    synthetic_probability?: number;
    real_probability?: number;
    voice_status?: string;
    confidence?: number;
    acoustic_features?: Record<string, number>;
  };

  speaker_analysis?: {
    speaker_match?: number | null;
    status?: string;
    verified?: boolean | null;
    confidence?: number;
    speaker_id?: string | null;
    speaker_name?: string | null;
  };

  context_analysis?: {
    context_risk?: number;
    social_engineering_score?: number;
    risk_factors?: string[];
    detected_categories?: string[];
    impersonation_context?: string;
    urgency_score?: number;
    secrecy_score?: number;
  };

  risk?: {
    score?: number;
    threat_level?: string;
    contributing_factors?: string[];
  };

  threat?: {
    categories?: string[];
    primary_threat?: string;
    recommendation?: string;
    action_code?: string;
    requires_immediate_action?: boolean;
  };

  audio?: {
    duration?: number;
    rms_energy?: number;
  };
};

export const LiveMonitorView: React.FC = () => {
  // =========================================================
  // UI STATE
  // =========================================================

  const [isRecording, setIsRecording] = useState(false);

  const [duration, setDuration] = useState(0);

  const [riskScore, setRiskScore] = useState(0);

  const [riskLevel, setRiskLevel] = useState('LOW');

  const [synthProb, setSynthProb] = useState(0);

  const [speakerSimilarity, setSpeakerSimilarity] =
    useState<number | null>(null);

  const [speakerStatus, setSpeakerStatus] =
    useState('NOT_ENROLLED');

  const [impersonation, setImpersonation] =
    useState('NONE');

  const [speakerProfiles, setSpeakerProfiles] =
    useState<any[]>([]);

  const [selectedSpeakerId, setSelectedSpeakerId] =
    useState<string>('');

  const [transcriptUtterances, setTranscriptUtterances] =
    useState<TranscriptUtterance[]>([]);

  const [timelineData, setTimelineData] =
    useState<TimelinePoint[]>([]);

  // =========================================================
  // REAL-TIME AUDIO / WEBSOCKET REFS
  // =========================================================

  const websocketRef =
    useRef<WebSocket | null>(null);

  const audioContextRef =
    useRef<AudioContext | null>(null);

  const mediaStreamRef =
    useRef<MediaStream | null>(null);

  const audioSourceRef =
    useRef<MediaStreamAudioSourceNode | null>(null);

  const processorRef =
    useRef<ScriptProcessorNode | null>(null);

  const speechRecognitionRef =
    useRef<any>(null);

  const isRecordingRef =
    useRef(false);

  const transcriptRef =
    useRef('');

  const utteranceIdRef =
    useRef(0);

  const lastTranscriptRef =
    useRef('');

  // =========================================================
  // BACKEND URL
  // =========================================================

  const BACKEND_HTTP_URL =
    'https://vigil-backend-bbwj.onrender.com';

  const BACKEND_WS_URL =
    'wss://vigil-backend-bbwj.onrender.com/ws/live-monitor';

  // =========================================================
  // FETCH SPEAKER PROFILES
  // =========================================================

  useEffect(() => {
    const loadSpeakerProfiles = async () => {
      try {
        const response = await fetch(
          `${BACKEND_HTTP_URL}/api/speaker/profiles`
        );

        if (!response.ok) {
          throw new Error(
            `Speaker profile request failed: ${response.status}`
          );
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setSpeakerProfiles(data);

          if (data.length > 0) {
            setSelectedSpeakerId(
              data[0].speaker_id
            );
          }
        }
      } catch (error) {
        console.warn(
          '[VIGIL] Could not load speaker profiles:',
          error
        );

        setSpeakerProfiles([]);
      }
    };

    loadSpeakerProfiles();
  }, []);

  // =========================================================
  // CLEANUP ON PAGE UNMOUNT
  // =========================================================

  useEffect(() => {
    return () => {
      stopAllMonitoring();
    };
  }, []);

  // =========================================================
  // TIMER
  // =========================================================

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null =
      null;

    if (isRecording) {
      timer = setInterval(() => {
        setDuration((previous) => previous + 1);
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isRecording]);

  // =========================================================
  // PCM FLOAT32 → PCM16 BASE64
  // =========================================================

  const float32ToPCM16Base64 = (
    input: Float32Array
  ): string => {
    const buffer = new ArrayBuffer(
      input.length * 2
    );

    const view = new DataView(buffer);

    for (let i = 0; i < input.length; i++) {
      const sample = Math.max(
        -1,
        Math.min(1, input[i])
      );

      const int16 =
        sample < 0
          ? sample * 0x8000
          : sample * 0x7fff;

      view.setInt16(
        i * 2,
        int16,
        true
      );
    }

    const bytes =
      new Uint8Array(buffer);

    let binary = '';

    const chunkSize = 8192;

    for (
      let i = 0;
      i < bytes.length;
      i += chunkSize
    ) {
      const end = Math.min(
        i + chunkSize,
        bytes.length
      );

      for (
        let j = i;
        j < end;
        j++
      ) {
        binary += String.fromCharCode(
          bytes[j]
        );
      }
    }

    return btoa(binary);
  };

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);

    const remainder = secs % 60;

    return `${mins < 10 ? '0' : ''}${mins}:${
      remainder < 10 ? '0' : ''
    }${remainder}`;
  };

  // =========================================================
  // PROCESS BACKEND ANALYSIS
  // =========================================================

  const processAnalysisMessage = (
    message: AnalysisMessage
  ) => {
    if (
      message.type !== 'analysis_update'
    ) {
      return;
    }

    // -------------------------------------------------------
    // RISK
    // -------------------------------------------------------

    const newRiskScore =
      Number(
        message.risk?.score ?? 0
      );

    const newRiskLevel =
      message.risk?.threat_level ||
      'LOW';

    setRiskScore(
      Math.max(
        0,
        Math.min(
          100,
          newRiskScore
        )
      )
    );

    setRiskLevel(
      newRiskLevel
    );

    // -------------------------------------------------------
    // VOICE AUTHENTICITY
    // -------------------------------------------------------

    const syntheticProbability =
      Number(
        message.voice_analysis
          ?.synthetic_probability ?? 0
      );

    setSynthProb(
      Math.max(
        0,
        Math.min(
          1,
          syntheticProbability
        )
      )
    );

    // -------------------------------------------------------
    // SPEAKER VERIFICATION
    // -------------------------------------------------------

    const speaker =
      message.speaker_analysis;

    const speakerMatch =
      speaker?.speaker_match;

    if (
      speakerMatch !== null &&
      speakerMatch !== undefined &&
      Number.isFinite(
        Number(speakerMatch)
      )
    ) {
      setSpeakerSimilarity(
        Number(speakerMatch)
      );
    } else {
      setSpeakerSimilarity(null);
    }

    setSpeakerStatus(
      speaker?.status ||
      'NOT_ENROLLED'
    );

    // -------------------------------------------------------
    // IMPERSONATION
    // -------------------------------------------------------

    setImpersonation(
      message.context_analysis
        ?.impersonation_context ||
      'NONE'
    );

    // -------------------------------------------------------
    // TRANSCRIPT
    // -------------------------------------------------------

    const incomingTranscript =
      message.transcript?.trim() || '';

    if (incomingTranscript) {
      const previousTranscript =
        lastTranscriptRef.current;

      if (
        incomingTranscript !==
        previousTranscript
      ) {
        lastTranscriptRef.current =
          incomingTranscript;

        utteranceIdRef.current += 1;

        setTranscriptUtterances(
          (previous) => [
            ...previous,
            {
              id:
                utteranceIdRef.current,
              speaker: 'CALLER',
              text: incomingTranscript,
              flags:
                message.context_analysis
                  ?.risk_factors || [],
            },
          ].slice(-20)
        );
      }
    }

    // -------------------------------------------------------
    // TIMELINE
    // -------------------------------------------------------

    setTimelineData(
      (previous) => [
        ...previous,
        {
          time: formatTime(
            duration
          ),
          score: newRiskScore,
        },
      ].slice(-30)
    );
  };

  // =========================================================
  // CONNECT WEBSOCKET
  // =========================================================

  const connectWebSocket =
    (): Promise<WebSocket> => {
      return new Promise(
        (resolve, reject) => {
          const websocket =
            new WebSocket(
              BACKEND_WS_URL
            );

          websocketRef.current =
            websocket;

          websocket.onopen = () => {
            console.log(
              '[VIGIL] WebSocket connected'
            );

            websocket.send(
              JSON.stringify({
                type: 'start_session',
                speaker_id:
                  selectedSpeakerId ||
                  null,
              })
            );

            resolve(websocket);
          };

          websocket.onmessage =
            (event) => {
              try {
                const message =
                  JSON.parse(
                    event.data
                  );

                processAnalysisMessage(
                  message
                );
              } catch (error) {
                console.error(
                  '[VIGIL] Invalid WebSocket message:',
                  error
                );
              }
            };

          websocket.onerror = (
            error
          ) => {
            console.error(
              '[VIGIL] WebSocket error:',
              error
            );

            reject(
              new Error(
                'Could not connect to VIGIL live analysis server.'
              )
            );
          };

          websocket.onclose = () => {
            console.log(
              '[VIGIL] WebSocket closed'
            );

            websocketRef.current =
              null;
          };
        }
      );
    };

  // =========================================================
  // START SPEECH RECOGNITION
  // =========================================================

  const startSpeechRecognition =
    () => {
      if (typeof window === 'undefined') {
        return;
      }

      const SpeechRecognition =
        (window as any)
          .SpeechRecognition ||
        (window as any)
          .webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.warn(
          '[VIGIL] Browser speech recognition is not available.'
        );

        return;
      }

      try {
        const recognition =
          new SpeechRecognition();

        recognition.continuous = true;

        recognition.interimResults =
          true;

        recognition.lang =
          'en-IN';

        recognition.onresult = (
          event: any
        ) => {
          let combinedText = '';

          for (
            let i =
              event.resultIndex;
            i <
            event.results.length;
            i++
          ) {
            const result =
              event.results[i];

            const text =
              result[0]
                ?.transcript || '';

            if (
              result.isFinal
            ) {
              combinedText +=
                `${text} `;
            }
          }

          const finalText =
            combinedText.trim();

          if (!finalText) {
            return;
          }

          transcriptRef.current =
            finalText;

          const websocket =
            websocketRef.current;

          if (
            websocket &&
            websocket.readyState ===
              WebSocket.OPEN
          ) {
            websocket.send(
              JSON.stringify({
                type: 'transcript',
                text: finalText,
              })
            );
          }
        };

        recognition.onerror = (
          event: any
        ) => {
          console.warn(
            '[VIGIL] Speech recognition error:',
            event?.error
          );
        };

        recognition.onend = () => {
          if (
            isRecordingRef.current
          ) {
            try {
              recognition.start();
            } catch {
              // Browser may already be restarting.
            }
          }
        };

        speechRecognitionRef.current =
          recognition;

        recognition.start();

        console.log(
          '[VIGIL] Speech recognition started'
        );
      } catch (error) {
        console.warn(
          '[VIGIL] Could not start speech recognition:',
          error
        );
      }
    };

  // =========================================================
  // STOP SPEECH RECOGNITION
  // =========================================================

  const stopSpeechRecognition =
    () => {
      const recognition =
        speechRecognitionRef.current;

      if (recognition) {
        try {
          recognition.onend =
            null;

          recognition.stop();
        } catch {
          // Already stopped.
        }
      }

      speechRecognitionRef.current =
        null;
    };

  // =========================================================
  // START MICROPHONE
  // =========================================================

  const startMicrophone =
    async () => {
      if (
        isRecordingRef.current
      ) {
        return;
      }

      try {
        // Reset session state.
        setRiskScore(0);
        setRiskLevel('LOW');
        setSynthProb(0);
        setSpeakerSimilarity(null);
        setSpeakerStatus(
          selectedSpeakerId
            ? 'CHECKING'
            : 'NOT_ENROLLED'
        );
        setImpersonation('NONE');
        setDuration(0);
        setTimelineData([]);
        setTranscriptUtterances([]);

        transcriptRef.current =
          '';

        lastTranscriptRef.current =
          '';

        utteranceIdRef.current =
          0;

        // -----------------------------------------------------
        // REQUEST MICROPHONE
        // -----------------------------------------------------

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: {
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
            }
          );

        mediaStreamRef.current =
          stream;

        // -----------------------------------------------------
        // CONNECT WEBSOCKET
        // -----------------------------------------------------

        const websocket =
          await connectWebSocket();

        // -----------------------------------------------------
        // AUDIO CONTEXT
        // -----------------------------------------------------

        const AudioContextClass =
          window.AudioContext ||
          (window as any)
            .webkitAudioContext;

        if (!AudioContextClass) {
          throw new Error(
            'Web Audio API is not supported by this browser.'
          );
        }

        const audioContext =
          new AudioContextClass();

        audioContextRef.current =
          audioContext;

        await audioContext.resume();

        // -----------------------------------------------------
        // MICROPHONE SOURCE
        // -----------------------------------------------------

        const source =
          audioContext.createMediaStreamSource(
            stream
          );

        audioSourceRef.current =
          source;

        // -----------------------------------------------------
        // PCM PROCESSOR
        // -----------------------------------------------------

        const processor =
          audioContext.createScriptProcessor(
            4096,
            1,
            1
          );

        processorRef.current =
          processor;

        processor.onaudioprocess =
          (event) => {
            if (
              !isRecordingRef.current
            ) {
              return;
            }

            if (
              websocket.readyState !==
              WebSocket.OPEN
            ) {
              return;
            }

            const input =
              event.inputBuffer.getChannelData(
                0
              );

            const pcmBase64 =
              float32ToPCM16Base64(
                input
              );

            websocket.send(
              JSON.stringify({
                type: 'audio_chunk',
                audio_b64:
                  pcmBase64,
                sample_rate:
                  audioContext.sampleRate,
                channels: 1,
                timestamp:
                  new Date().toISOString(),
              })
            );
          };

        source.connect(
          processor
        );

        /*
         * Connect to destination so the ScriptProcessor
         * remains active in browsers.
         *
         * The microphone stream itself is not routed
         * directly to the speakers.
         */
        processor.connect(
          audioContext.destination
        );

        // -----------------------------------------------------
        // MARK RECORDING ACTIVE
        // -----------------------------------------------------

        isRecordingRef.current =
          true;

        setIsRecording(true);

        // -----------------------------------------------------
        // START SPEECH RECOGNITION
        // -----------------------------------------------------

        startSpeechRecognition();

        console.log(
          '[VIGIL] Live microphone monitoring started'
        );
      } catch (error) {
        console.error(
          '[VIGIL] Failed to start microphone:',
          error
        );

        stopAllMonitoring();

        alert(
          'VIGIL could not start microphone monitoring. Please allow microphone access and try again.'
        );
      }
    };

  // =========================================================
  // STOP EVERYTHING
  // =========================================================

  const stopAllMonitoring =
    () => {
      isRecordingRef.current =
        false;

      stopSpeechRecognition();

      // -------------------------------------------------------
      // AUDIO PROCESSOR
      // -------------------------------------------------------

      try {
        processorRef.current?.disconnect();
      } catch {
        // Already disconnected.
      }

      processorRef.current =
        null;

      // -------------------------------------------------------
      // AUDIO SOURCE
      // -------------------------------------------------------

      try {
        audioSourceRef.current?.disconnect();
      } catch {
        // Already disconnected.
      }

      audioSourceRef.current =
        null;

      // -------------------------------------------------------
      // MICROPHONE TRACKS
      // -------------------------------------------------------

      if (
        mediaStreamRef.current
      ) {
        mediaStreamRef.current
          .getTracks()
          .forEach(
            (track) => {
              track.stop();
            }
          );
      }

      mediaStreamRef.current =
        null;

      // -------------------------------------------------------
      // AUDIO CONTEXT
      // -------------------------------------------------------

      if (
        audioContextRef.current
      ) {
        try {
          audioContextRef.current.close();
        } catch {
          // Already closed.
        }
      }

      audioContextRef.current =
        null;

      // -------------------------------------------------------
      // WEBSOCKET
      // -------------------------------------------------------

      const websocket =
        websocketRef.current;

      if (websocket) {
        try {
          if (
            websocket.readyState ===
            WebSocket.OPEN
          ) {
            websocket.send(
              JSON.stringify({
                type: 'stop_session',
              })
            );
          }
        } catch {
          // Ignore send failure during cleanup.
        }

        try {
          websocket.close();
        } catch {
          // Already closed.
        }
      }

      websocketRef.current =
        null;

      setIsRecording(false);
      setDuration(0);

      console.log(
        '[VIGIL] Live monitoring stopped'
      );
    };

  // =========================================================
  // START / STOP BUTTON
  // =========================================================

  const toggleRecording =
    async () => {
      if (
        isRecordingRef.current
      ) {
        stopAllMonitoring();
      } else {
        await startMicrophone();
      }
    };

  // =========================================================
  // UI HELPERS
  // =========================================================

  const getSpeakerDisplay =
    () => {
      if (
        speakerSimilarity ===
        null
      ) {
        return '--';
      }

      return `${(
        speakerSimilarity * 100
      ).toFixed(0)}%`;
    };

  const getSpeakerStatusLabel =
    () => {
      if (
        speakerStatus ===
        'NOT_ENROLLED'
      ) {
        return 'NOT ENROLLED';
      }

      if (
        speakerStatus ===
        'CHECKING'
      ) {
        return 'CHECKING';
      }

      return speakerStatus;
    };

  const getSpeakerStatusClass =
    () => {
      if (
        speakerStatus ===
        'MATCH'
      ) {
        return 'bg-emerald-500/20 text-emerald-400';
      }

      if (
        speakerStatus ===
        'NOT_ENROLLED'
      ) {
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      }

      if (
        speakerStatus ===
        'CHECKING'
      ) {
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      }

      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    };

  const recommendedAction =
    riskLevel === 'CRITICAL'
      ? 'Do NOT share OTP, PIN, credentials or transfer money. Terminate the interaction immediately and independently verify the caller.'
      : riskLevel === 'HIGH'
      ? 'Do not share sensitive information. Verify the caller through an independent trusted channel.'
      : riskLevel === 'MODERATE'
      ? 'Exercise heightened caution. Do not share financial or account details without independent verification.'
      : riskLevel === 'GUARDED'
      ? 'Suspicious signals detected. Verify the caller identity before sharing sensitive information.'
      : 'Conversation appears normal. Continue with standard security hygiene.';

  // =========================================================
  // UI
  // =========================================================

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
            {isRecording ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}

            <span>
              {isRecording
                ? 'Stop Live Monitor'
                : 'Start Microphone Monitor'}
            </span>
          </button>

          <div className="flex items-center space-x-3 text-xs font-mono bg-[#0B0F17] px-3.5 py-2 rounded-lg border border-[#26334D]">
            <Clock className="w-4 h-4 text-blue-400" />

            <span className="text-gray-400">
              Duration:
            </span>

            <span className="font-bold text-white">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Dynamic Speaker Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400 font-mono">
            Target Profile:
          </span>

          {speakerProfiles.length > 0 ? (
            <select
              value={selectedSpeakerId}
              onChange={(e) =>
                setSelectedSpeakerId(
                  e.target.value
                )
              }
              disabled={isRecording}
              className="bg-[#192233] border border-[#26334D] text-xs font-bold text-blue-400 rounded px-2.5 py-1 focus:outline-none disabled:opacity-50"
            >
              {speakerProfiles.map(
                (p) => (
                  <option
                    key={p.speaker_id}
                    value={p.speaker_id}
                  >
                    {p.speaker_id} (
                    {p.name})
                  </option>
                )
              )}
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
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#121824] border border-[#26334D] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
                Acoustic Audio Oscilloscope
              </h3>

              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  isRecording
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {isRecording
                  ? 'STREAMING'
                  : 'IDLE'}
              </span>
            </div>

            <AudioWaveform
              isRecording={
                isRecording
              }
              color={
                riskScore > 60
                  ? '#EF4444'
                  : '#3B82F6'
              }
            />
          </div>

          <div className="bg-[#121824] border border-[#26334D] rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono border-b border-[#26334D] pb-2">
              Voice Authenticity Metrics
            </h3>

            <div className="flex items-center justify-between bg-[#192233] p-3 rounded-lg border border-[#26334D]">
              <div>
                <div className="text-xs text-gray-400">
                  AI Voice Probability
                </div>

                <div className="text-lg font-bold font-mono text-white">
                  {(synthProb * 100).toFixed(
                    0
                  )}
                  %
                </div>
              </div>

              <div
                className={`px-2.5 py-1 text-xs font-bold rounded ${
                  synthProb >
                  0.60
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {synthProb >
                0.60
                  ? 'SYNTHETIC'
                  : 'REAL HUMAN'}
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#192233] p-3 rounded-lg border border-[#26334D]">
              <div>
                <div className="text-xs text-gray-400">
                  Speaker Biometric Match
                </div>

                <div className="text-lg font-bold font-mono text-white">
                  {getSpeakerDisplay()}
                </div>
              </div>

              <div
                className={`px-2.5 py-1 text-xs font-bold rounded ${getSpeakerStatusClass()}`}
              >
                {getSpeakerStatusLabel()}
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#192233] p-3 rounded-lg border border-[#26334D]">
              <div>
                <div className="text-xs text-gray-400">
                  Impersonation Context
                </div>

                <div className="text-sm font-bold font-mono text-amber-400">
                  {impersonation}
                </div>
              </div>

              <Zap className="w-4 h-4 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Center Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#121824] border border-[#26334D] rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono mb-2">
              DYNAMIC RISK EVALUATION
            </h3>

            <RiskGauge
              score={riskScore}
              level={riskLevel}
              size={210}
            />

            <div
              className={`mt-6 w-full p-4 rounded-xl border text-left flex items-start space-x-3 ${
                riskLevel ===
                'CRITICAL'
                  ? 'bg-red-500/10 border-red-500/40 text-red-300'
                  : riskLevel ===
                    'HIGH'
                  ? 'bg-orange-500/10 border-orange-500/40 text-orange-300'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
              }`}
            >
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />

              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  RECOMMENDED ACTION:
                </div>

                <div className="text-xs mt-1 leading-relaxed">
                  {recommendedAction}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#121824] border border-[#26334D] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono mb-3">
              Conversation Risk Timeline
            </h3>

            <div className="h-36">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={timelineData}
                >
                  <XAxis
                    dataKey="time"
                    stroke="#4B5563"
                    tick={{
                      fontSize: 10,
                    }}
                  />

                  <YAxis
                    domain={[0, 100]}
                    stroke="#4B5563"
                    tick={{
                      fontSize: 10,
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor:
                        '#192233',
                      borderColor:
                        '#26334D',
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={
                      riskScore > 60
                        ? '#EF4444'
                        : '#3B82F6'
                    }
                    strokeWidth={3}
                    dot={{
                      r: 4,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3 bg-[#121824] border border-[#26334D] rounded-xl p-5 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono border-b border-[#26334D] pb-2 mb-4">
              Live Speech-to-Text Transcript
            </h3>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {transcriptUtterances.length ===
              0 ? (
                <div className="bg-[#192233] p-3 rounded-lg border border-[#26334D]">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {isRecording
                      ? 'Listening for speech...'
                      : 'Start the microphone monitor to begin live transcription.'}
                  </p>
                </div>
              ) : (
                transcriptUtterances.map(
                  (u) => (
                    <div
                      key={u.id}
                      className="bg-[#192233] p-3 rounded-lg border border-[#26334D] space-y-2"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                        <span className="font-bold text-blue-400">
                          {u.speaker}
                        </span>

                        <span>
                          16kHz Mono
                        </span>
                      </div>

                      <p className="text-xs text-gray-200 leading-relaxed font-sans">
                        {u.text}
                      </p>

                      {u.flags &&
                        u.flags.length >
                          0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {u.flags.map(
                              (
                                flag
                              ) => (
                                <span
                                  key={
                                    flag
                                  }
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-mono"
                                >
                                  {flag}
                                </span>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
