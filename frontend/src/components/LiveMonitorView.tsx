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

type SpeakerProfile = {
  speaker_id: string;
  name?: string;
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
    useState<SpeakerProfile[]>([]);

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

          let connectionResolved =
            false;

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

            connectionResolved =
              true;

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

            if (!connectionResolved) {
              reject(
                new Error(
                  'Could not connect to VIGIL live analysis server.'
                )
              );
            }
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
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

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
          // Ignore send failure.
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
    };

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
    let timer:
      ReturnType<typeof setInterval> | null =
      null;

    if (isRecording) {
      timer = setInterval(() => {
        setDuration(
          (previous) =>
            previous + 1
        );
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isRecording]);

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
        // -----------------------------------------------------
        // RESET SESSION STATE
        // -----------------------------------------------------

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
         * Connect processor to destination
         * so ScriptProcessorNode remains active.
         *
         * The microphone is NOT directly routed
         * to the speakers.
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
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
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
    <div className="w-full min-w-0 p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">

      {/* =====================================================
          TOP CONTROL BAR
          ===================================================== */}

      <div className="w-full min-w-0 bg-[#121824] border border-[#26334D] rounded-xl p-3 sm:p-4">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

          {/* MICROPHONE + TIMER */}

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

            <button
              onClick={toggleRecording}
              className={`w-full sm:w-auto min-h-[48px] flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm transition-all shadow-lg ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
              }`}
            >
              {isRecording ? (
                <MicOff className="w-4 h-4 flex-shrink-0" />
              ) : (
                <Mic className="w-4 h-4 flex-shrink-0" />
              )}

              <span className="whitespace-nowrap">
                {isRecording
                  ? 'Stop Live Monitor'
                  : 'Start Microphone Monitor'}
              </span>
            </button>

            <div className="w-full sm:w-auto min-h-[48px] flex items-center justify-center gap-2 text-xs font-mono bg-[#0B0F17] px-4 py-3 rounded-lg border border-[#26334D]">

              <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />

              <span className="text-gray-400">
                Duration:
              </span>

              <span className="font-bold text-white">
                {formatTime(duration)}
              </span>

            </div>
          </div>

          {/* TARGET SPEAKER */}

          <div className="w-full lg:w-auto min-w-0">

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">

              <span className="text-xs text-gray-400 font-mono whitespace-nowrap">
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
                  className="w-full sm:w-auto min-w-0 max-w-full bg-[#192233] border border-[#26334D] text-xs font-bold text-blue-400 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                >
                  {speakerProfiles.map(
                    (profile) => (
                      <option
                        key={
                          profile.speaker_id
                        }
                        value={
                          profile.speaker_id
                        }
                      >
                        {profile.speaker_id}
                        {profile.name
                          ? ` (${profile.name})`
                          : ''}
                      </option>
                    )
                  )}
                </select>
              ) : (
                <span className="w-full sm:w-auto text-center text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-2.5 rounded-lg">
                  No Speaker Enrolled Yet
                </span>
              )}

            </div>

          </div>

        </div>
      </div>

      {/* =====================================================
          MAIN RESPONSIVE GRID
          ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">

        {/* ===================================================
            LEFT COLUMN
            =================================================== */}

        <div className="lg:col-span-4 space-y-4 md:space-y-6 min-w-0">

          {/* AUDIO WAVEFORM */}

          <div className="w-full min-w-0 bg-[#121824] border border-[#26334D] rounded-xl p-4 sm:p-5">

            <div className="flex items-center justify-between gap-3 mb-3">

              <h3 className="min-w-0 text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono truncate">
                Acoustic Audio Oscilloscope
              </h3>

              <span
                className={`flex-shrink-0 text-[10px] font-mono px-2 py-1 rounded ${
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

            <div className="w-full min-w-0 overflow-hidden rounded-lg">

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

          </div>

          {/* VOICE AUTHENTICITY */}

          <div className="w-full min-w-0 bg-[#121824] border border-[#26334D] rounded-xl p-4 sm:p-5 space-y-3">

            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono border-b border-[#26334D] pb-3">
              Voice Authenticity Metrics
            </h3>

            {/* AI PROBABILITY */}

            <div className="w-full min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#192233] p-3 rounded-lg border border-[#26334D]">

              <div className="min-w-0">
                <div className="text-xs text-gray-400">
                  AI Voice Probability
                </div>

                <div className="text-lg font-bold font-mono text-white">
                  {(
                    synthProb * 100
                  ).toFixed(0)}
                  %
                </div>
              </div>

              <div
                className={`self-start sm:self-auto flex-shrink-0 px-2.5 py-1.5 text-xs font-bold rounded ${
                  synthProb >
                  0.6
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {synthProb >
                0.6
                  ? 'SYNTHETIC'
                  : 'REAL HUMAN'}
              </div>

            </div>

            {/* SPEAKER MATCH */}

            <div className="w-full min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#192233] p-3 rounded-lg border border-[#26334D]">

              <div className="min-w-0">
                <div className="text-xs text-gray-400">
                  Speaker Biometric Match
                </div>

                <div className="text-lg font-bold font-mono text-white">
                  {getSpeakerDisplay()}
                </div>
              </div>

              <div
                className={`self-start sm:self-auto flex-shrink-0 px-2.5 py-1.5 text-xs font-bold rounded ${getSpeakerStatusClass()}`}
              >
                {getSpeakerStatusLabel()}
              </div>

            </div>

            {/* IMPERSONATION */}

            <div className="w-full min-w-0 flex items-center justify-between gap-3 bg-[#192233] p-3 rounded-lg border border-[#26334D]">

              <div className="min-w-0">
                <div className="text-xs text-gray-400">
                  Impersonation Context
                </div>

                <div className="text-sm font-bold font-mono text-amber-400 break-words">
                  {impersonation}
                </div>
              </div>

              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />

            </div>

          </div>

        </div>

        {/* ===================================================
            CENTER COLUMN
            =================================================== */}

        <div className="lg:col-span-5 space-y-4 md:space-y-6 min-w-0">

          {/* RISK */}

          <div className="w-full min-w-0 bg-[#121824] border border-[#26334D] rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center text-center">

            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono mb-2">
              Dynamic Risk Evaluation
            </h3>

            <div className="w-full flex justify-center overflow-hidden">

              <RiskGauge
                score={riskScore}
                level={riskLevel}
                size={210}
              />

            </div>

            {/* RECOMMENDED ACTION */}

            <div
              className={`mt-5 w-full min-w-0 p-3 sm:p-4 rounded-xl border text-left flex items-start gap-3 ${
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

              <div className="min-w-0">

                <div className="text-xs font-bold uppercase tracking-wider">
                  Recommended Action:
                </div>

                <div className="text-xs mt-1 leading-relaxed break-words">
                  {recommendedAction}
                </div>

              </div>

            </div>

          </div>

          {/* RISK TIMELINE */}

          <div className="w-full min-w-0 bg-[#121824] border border-[#26334D] rounded-xl p-4 sm:p-5">

            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono mb-3">
              Conversation Risk Timeline
            </h3>

            <div className="w-full h-40 min-w-0">

              {timelineData.length ===
              0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-500 border border-[#26334D] rounded-lg bg-[#0B0F17]">
                  Risk timeline will appear during live analysis.
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={timelineData}
                    margin={{
                      top: 5,
                      right: 5,
                      left: -20,
                      bottom: 0,
                    }}
                  >

                    <XAxis
                      dataKey="time"
                      stroke="#4B5563"
                      tick={{
                        fontSize: 9,
                      }}
                    />

                    <YAxis
                      domain={[0, 100]}
                      stroke="#4B5563"
                      tick={{
                        fontSize: 9,
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor:
                          '#192233',
                        borderColor:
                          '#26334D',
                        borderRadius:
                          '8px',
                        fontSize:
                          '11px',
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
                        r: 3,
                      }}
                      activeDot={{
                        r: 5,
                      }}
                    />

                  </LineChart>
                </ResponsiveContainer>
              )}

            </div>

          </div>

        </div>

        {/* ===================================================
            RIGHT COLUMN
            =================================================== */}

        <div className="lg:col-span-3 min-w-0 bg-[#121824] border border-[#26334D] rounded-xl p-4 sm:p-5">

          <div className="flex flex-col gap-3 mb-4">

            <div className="flex items-center justify-between gap-3">

              <h3 className="min-w-0 text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
                Live Speech-to-Text Transcript
              </h3>

              {isRecording && (
                <span className="flex-shrink-0 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                  LIVE
                </span>
              )}

            </div>

            <div className="h-px bg-[#26334D]" />

          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">

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
                    className="w-full min-w-0 bg-[#192233] p-3 rounded-lg border border-[#26334D] space-y-2"
                  >

                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-gray-400">

                      <span className="font-bold text-blue-400">
                        {u.speaker}
                      </span>

                      <span className="flex-shrink-0">
                        16kHz Mono
                      </span>

                    </div>

                    <p className="text-xs text-gray-200 leading-relaxed font-sans break-words">
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
                                className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-mono break-all"
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
  );
};
