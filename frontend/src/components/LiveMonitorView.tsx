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

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://vigil-backend-bbwj.onrender.com';

const WS_BASE = API_BASE.replace(/^http/, 'ws');

interface TranscriptUtterance {
  id: number;
  speaker: string;
  text: string;
  flags?: string[];
}

interface TimelinePoint {
  time: string;
  score: number;
}

interface SpeakerProfile {
  speaker_id: string;
  name: string;
}

interface AnalysisMessage {
  type?: string;
  session_id?: string;

  transcript?: string;

  voice_analysis?: {
    synthetic_probability?: number;
    voice_status?: string;
    confidence?: number;
  };

  speaker_analysis?: {
    speaker_match?: number | null;
    status?: string;
  };

  context_analysis?: {
    context_risk?: number;
    risk_factors?: string[];
    detected_categories?: string[];
  };

  risk?: {
    score?: number;
    threat_level?: string;
    recommendation?: string;
  };
}

interface BrowserSpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface BrowserSpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;

  start: () => void;
  stop: () => void;
  abort: () => void;

  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
}

interface BrowserSpeechRecognitionConstructor {
  new (): BrowserSpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

export const LiveMonitorView: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);

  const [duration, setDuration] = useState(0);

  const [riskScore, setRiskScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState('LOW');

  const [synthProb, setSynthProb] = useState(0);

  const [speakerSimilarity, setSpeakerSimilarity] =
    useState<number | null>(null);

  const [speakerStatus, setSpeakerStatus] =
    useState('NOT ENROLLED');

  const [impersonation, setImpersonation] =
    useState('NONE');

  const [speakerProfiles, setSpeakerProfiles] =
    useState<SpeakerProfile[]>([]);

  const [selectedSpeakerId, setSelectedSpeakerId] =
    useState('');

  const [transcriptUtterances, setTranscriptUtterances] =
    useState<TranscriptUtterance[]>([]);

  const [timelineData, setTimelineData] =
    useState<TimelinePoint[]>([
      {
        time: '00:00',
        score: 0,
      },
    ]);

  const [recommendation, setRecommendation] =
    useState(
      'Start the microphone monitor to begin real-time voice security analysis.'
    );

  const [connectionStatus, setConnectionStatus] =
    useState('OFFLINE');

  const [speechStatus, setSpeechStatus] =
    useState('STANDBY');

  const [microphoneStatus, setMicrophoneStatus] =
    useState('OFF');

  const mediaStreamRef =
    useRef<MediaStream | null>(null);

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const websocketRef =
    useRef<WebSocket | null>(null);

  const recognitionRef =
    useRef<BrowserSpeechRecognition | null>(null);

  const durationIntervalRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const transcriptIdRef =
    useRef(0);

  const finalTranscriptRef =
    useRef('');

  const recordingStartRef =
    useRef<number | null>(null);

  const shouldRestartRecognitionRef =
    useRef(false);

  const wsConnectedRef =
    useRef(false);

  /*
   * ---------------------------------------------------------
   * FETCH SPEAKER PROFILES
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const fetchSpeakerProfiles = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/speaker/profiles`
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
        console.error(
          'Failed to fetch speaker profiles:',
          error
        );

        setSpeakerProfiles([]);
        setSelectedSpeakerId('');
      }
    };

    fetchSpeakerProfiles();

    return () => {
      stopEverything();
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * TIMER
   * ---------------------------------------------------------
   */

  const startTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    recordingStartRef.current = Date.now();

    durationIntervalRef.current =
      setInterval(() => {
        if (!recordingStartRef.current) {
          return;
        }

        const elapsed = Math.floor(
          (Date.now() -
            recordingStartRef.current) /
            1000
        );

        setDuration(elapsed);
      }, 500);
  };

  const stopTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  /*
   * ---------------------------------------------------------
   * FORMAT TIME
   * ---------------------------------------------------------
   */

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;

    return `${mins < 10 ? '0' : ''}${mins}:${
      remainder < 10 ? '0' : ''
    }${remainder}`;
  };

  /*
   * ---------------------------------------------------------
   * RESET ANALYSIS
   * ---------------------------------------------------------
   */

  const resetAnalysis = () => {
    setDuration(0);

    setRiskScore(0);
    setRiskLevel('LOW');

    setSynthProb(0);

    setSpeakerSimilarity(null);
    setSpeakerStatus(
      speakerProfiles.length > 0
        ? 'READY'
        : 'NOT ENROLLED'
    );

    setImpersonation('NONE');

    setRecommendation(
      'Listening for speech and security signals...'
    );

    setTranscriptUtterances([]);

    setTimelineData([
      {
        time: '00:00',
        score: 0,
      },
    ]);

    finalTranscriptRef.current = '';
    transcriptIdRef.current = 0;
  };

  /*
   * ---------------------------------------------------------
   * SEND JSON THROUGH WEBSOCKET
   * ---------------------------------------------------------
   */

  const sendWebSocketMessage = (
    payload: Record<string, unknown>
  ) => {
    const socket = websocketRef.current;

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      return false;
    }

    try {
      socket.send(JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error(
        'WebSocket send failed:',
        error
      );

      return false;
    }
  };

  /*
   * ---------------------------------------------------------
   * PROCESS BACKEND ANALYSIS
   * ---------------------------------------------------------
   */

  const processAnalysisMessage = (
    message: AnalysisMessage
  ) => {
    /*
     * VOICE AUTHENTICITY
     */

    const syntheticProbability =
      message.voice_analysis
        ?.synthetic_probability;

    if (
      typeof syntheticProbability ===
      'number'
    ) {
      const normalized =
        Math.max(
          0,
          Math.min(1, syntheticProbability)
        );

      setSynthProb(normalized);
    }

    /*
     * SPEAKER VERIFICATION
     */

    const speakerMatch =
      message.speaker_analysis
        ?.speaker_match;

    if (
      typeof speakerMatch === 'number'
    ) {
      const normalized =
        Math.max(
          0,
          Math.min(1, speakerMatch)
        );

      setSpeakerSimilarity(normalized);
    } else if (
      speakerMatch === null
    ) {
      setSpeakerSimilarity(null);
    }

    const backendSpeakerStatus =
      message.speaker_analysis?.status;

    if (backendSpeakerStatus) {
      setSpeakerStatus(
        backendSpeakerStatus.toUpperCase()
      );
    }

    /*
     * CONTEXT / IMPERSONATION
     */

    const categories =
      message.context_analysis
        ?.detected_categories || [];

    const riskFactors =
      message.context_analysis
        ?.risk_factors || [];

    if (categories.length > 0) {
      setImpersonation(
        categories
          .join(' / ')
          .toUpperCase()
      );
    } else if (
      riskFactors.length > 0
    ) {
      setImpersonation(
        riskFactors[0].toUpperCase()
      );
    } else {
      setImpersonation('NONE');
    }

    /*
     * RISK ENGINE
     */

    const score =
      message.risk?.score;

    if (typeof score === 'number') {
      const safeScore = Math.max(
        0,
        Math.min(100, score)
      );

      setRiskScore(safeScore);

      const now = new Date();

      const mins = String(
        Math.floor(
          (now.getTime() -
            (recordingStartRef.current ||
              now.getTime())) /
            60000
        )
      ).padStart(2, '0');

      const secs = String(
        Math.floor(
          ((now.getTime() -
            (recordingStartRef.current ||
              now.getTime())) %
            60000) /
            1000
        )
      ).padStart(2, '0');

      setTimelineData((previous) => {
        const updated = [
          ...previous,
          {
            time: `${mins}:${secs}`,
            score: safeScore,
          },
        ];

        return updated.slice(-20);
      });
    }

    const level =
      message.risk?.threat_level;

    if (level) {
      setRiskLevel(
        level.toUpperCase()
      );
    }

    if (message.risk?.recommendation) {
      setRecommendation(
        message.risk.recommendation
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * OPEN WEBSOCKET
   * ---------------------------------------------------------
   */

  const connectWebSocket = (): Promise<void> => {
    return new Promise(
      (resolve, reject) => {
        try {
          const socket = new WebSocket(
            `${WS_BASE}/ws/live-monitor`
          );

          websocketRef.current = socket;

          socket.onopen = () => {
            console.log(
              'VIGIL WebSocket connected'
            );

            wsConnectedRef.current = true;

            setConnectionStatus(
              'CONNECTED'
            );

            /*
             * Tell backend that a new
             * monitoring session started.
             */

            sendWebSocketMessage({
              type: 'start_session',
              target_speaker_id:
                selectedSpeakerId || null,
            });

            resolve();
          };

          socket.onmessage = (
            event
          ) => {
            try {
              const message =
                JSON.parse(
                  event.data
                ) as AnalysisMessage;

              console.log(
                'VIGIL analysis:',
                message
              );

              if (
                message.type ===
                'error'
              ) {
                console.error(
                  'Backend analysis error:',
                  message
                );

                return;
              }

              processAnalysisMessage(
                message
              );
            } catch (error) {
              console.error(
                'Invalid WebSocket message:',
                error
              );
            }
          };

          socket.onerror = (event) => {
            console.error(
              'VIGIL WebSocket error:',
              event
            );

            setConnectionStatus(
              'ERROR'
            );

            wsConnectedRef.current =
              false;

            reject(
              new Error(
                'Unable to connect to VIGIL analysis server.'
              )
            );
          };

          socket.onclose = () => {
            console.log(
              'VIGIL WebSocket disconnected'
            );

            wsConnectedRef.current =
              false;

            setConnectionStatus(
              'OFFLINE'
            );
          };
        } catch (error) {
          reject(error);
        }
      }
    );
  };

  /*
   * ---------------------------------------------------------
   * SPEECH TO TEXT
   * ---------------------------------------------------------
   */

  const startSpeechRecognition = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechStatus(
        'UNSUPPORTED'
      );

      setRecommendation(
        'Live speech-to-text is not supported by this browser. Use a Chromium-based browser such as Chrome or Edge.'
      );

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;

    /*
     * Indian English is used because this
     * application is intended for Indian
     * voice-security scenarios.
     */

    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      console.log(
        'Speech recognition started'
      );

      setSpeechStatus(
        'LISTENING'
      );
    };

    recognition.onresult = (
      event
    ) => {
      let finalText = '';
      let interimText = '';

      for (
        let i = 0;
        i < event.results.length;
        i++
      ) {
        const result =
          event.results[i];

        const transcript =
          result[0]?.transcript || '';

        if (result.isFinal) {
          finalText +=
            transcript + ' ';
        } else {
          interimText +=
            transcript + ' ';
        }
      }

      finalText =
        finalText.trim();

      interimText =
        interimText.trim();

      /*
       * Add final transcript to
       * VIGIL transcript history.
       */

      if (finalText) {
        finalTranscriptRef.current =
          `${finalTranscriptRef.current} ${finalText}`.trim();

        const id =
          ++transcriptIdRef.current;

        setTranscriptUtterances(
          (previous) => [
            ...previous,
            {
              id,
              speaker: 'CALLER',
              text: finalText,
            },
          ].slice(-50)
        );

        /*
         * Send actual spoken text
         * to backend.
         */

        sendWebSocketMessage({
          type: 'transcript',
          text: finalText,
          target_speaker_id:
            selectedSpeakerId || null,
        });
      }

      /*
       * Interim text is deliberately
       * not permanently inserted into
       * the transcript list.
       */
      void interimText;
    };

    recognition.onerror = (
      event
    ) => {
      console.error(
        'Speech recognition error:',
        event.error
      );

      if (
        event.error ===
        'not-allowed'
      ) {
        setSpeechStatus(
          'PERMISSION DENIED'
        );

        setRecommendation(
          'Microphone permission was denied for speech recognition. Allow microphone access in your browser and start the monitor again.'
        );
      } else if (
        event.error ===
        'no-speech'
      ) {
        setSpeechStatus(
          'WAITING FOR SPEECH'
        );
      } else {
        setSpeechStatus(
          'ERROR'
        );
      }
    };

    recognition.onend = () => {
      console.log(
        'Speech recognition ended'
      );

      if (
        shouldRestartRecognitionRef.current &&
        isRecording
      ) {
        try {
          recognition.start();
        } catch {
          // Browser can throw if recognition
          // is already starting.
        }
      } else {
        setSpeechStatus(
          'STOPPED'
        );
      }
    };

    recognitionRef.current =
      recognition;

    shouldRestartRecognitionRef.current =
      true;

    try {
      recognition.start();
    } catch (error) {
      console.error(
        'Could not start speech recognition:',
        error
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * AUDIO STREAM
   * ---------------------------------------------------------
   */

  const startAudioStreaming = (
    stream: MediaStream
  ) => {
    if (
      typeof MediaRecorder ===
      'undefined'
    ) {
      setRecommendation(
        'MediaRecorder is not supported by this browser.'
      );

      return;
    }

    let mimeType = '';

    if (
      MediaRecorder.isTypeSupported(
        'audio/webm;codecs=opus'
      )
    ) {
      mimeType =
        'audio/webm;codecs=opus';
    } else if (
      MediaRecorder.isTypeSupported(
        'audio/webm'
      )
    ) {
      mimeType =
        'audio/webm';
    }

    const recorder =
      mimeType
        ? new MediaRecorder(
            stream,
            { mimeType }
          )
        : new MediaRecorder(stream);

    mediaRecorderRef.current =
      recorder;

    recorder.ondataavailable =
      async (event) => {
        if (
          !event.data ||
          event.data.size === 0
        ) {
          return;
        }

        /*
         * Convert the audio chunk to
         * base64 so it can safely travel
         * through the JSON WebSocket
         * protocol.
         */

        try {
          const buffer =
            await event.data.arrayBuffer();

          const bytes =
            new Uint8Array(buffer);

          let binary = '';

          const chunkSize = 0x8000;

          for (
            let i = 0;
            i < bytes.length;
            i += chunkSize
          ) {
            const chunk =
              bytes.subarray(
                i,
                Math.min(
                  i + chunkSize,
                  bytes.length
                )
              );

            binary += String.fromCharCode(
              ...chunk
            );
          }

          const base64 =
            btoa(binary);

          sendWebSocketMessage({
            type: 'audio_chunk',
            audio: base64,
            mime_type:
              recorder.mimeType ||
              'audio/webm',
            target_speaker_id:
              selectedSpeakerId || null,
          });
        } catch (error) {
          console.error(
            'Failed to encode audio chunk:',
            error
          );
        }
      };

    recorder.onerror = (
      event
    ) => {
      console.error(
        'MediaRecorder error:',
        event
      );
    };

    /*
     * Send an audio chunk every
     * second for near-real-time analysis.
     */

    recorder.start(1000);
  };

  /*
   * ---------------------------------------------------------
   * START MONITOR
   * ---------------------------------------------------------
   */

  const startMonitoring =
    async () => {
      if (isRecording) {
        return;
      }

      resetAnalysis();

      setConnectionStatus(
        'CONNECTING'
      );

      setMicrophoneStatus(
        'REQUESTING'
      );

      try {
        /*
         * IMPORTANT:
         * getUserMedia MUST be triggered
         * by the user's button action.
         *
         * This causes the browser to show
         * the microphone permission dialog.
         */

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
              video: false,
            }
          );

        mediaStreamRef.current =
          stream;

        setMicrophoneStatus(
          'ACTIVE'
        );

        /*
         * Connect backend.
         */

        try {
          await connectWebSocket();
        } catch (error) {
          console.error(
            'WebSocket connection failed:',
            error
          );

          /*
           * Do not stop microphone simply
           * because backend connection failed.
           * STT can still work locally.
           */

          setConnectionStatus(
            'ERROR'
          );

          setRecommendation(
            'Microphone and browser speech recognition are active, but the VIGIL analysis server could not be reached.'
          );
        }

        /*
         * Start audio streaming.
         */

        startAudioStreaming(
          stream
        );

        /*
         * Start browser STT.
         */

        startSpeechRecognition();

        setIsRecording(true);

        startTimer();

        setRecommendation(
          'VIGIL is listening. Speak normally; the system will analyze the conversation and update the risk score.'
        );
      } catch (error: unknown) {
        console.error(
          'Microphone access failed:',
          error
        );

        setMicrophoneStatus(
          'DENIED'
        );

        setIsRecording(false);

        setConnectionStatus(
          'OFFLINE'
        );

        if (
          error instanceof DOMException &&
          error.name ===
            'NotAllowedError'
        ) {
          setRecommendation(
            'Microphone permission was denied. Allow microphone access for this site in your browser settings and press Start again.'
          );
        } else if (
          error instanceof DOMException &&
          error.name ===
            'NotFoundError'
        ) {
          setRecommendation(
            'No microphone was found. Connect a microphone and try again.'
          );
        } else {
          setRecommendation(
            'VIGIL could not access the microphone. Check your browser microphone permissions.'
          );
        }
      }
    };

  /*
   * ---------------------------------------------------------
   * STOP MONITOR
   * ---------------------------------------------------------
   */

  const stopEverything = () => {
    shouldRestartRecognitionRef.current =
      false;

    /*
     * Stop speech recognition.
     */

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Already stopped.
      }

      recognitionRef.current =
        null;
    }

    /*
     * Stop MediaRecorder.
     */

    if (
      mediaRecorderRef.current
    ) {
      try {
        if (
          mediaRecorderRef.current
            .state !== 'inactive'
        ) {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // Already stopped.
      }

      mediaRecorderRef.current =
        null;
    }

    /*
     * Release microphone.
     */

    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      mediaStreamRef.current =
        null;
    }

    /*
     * Close WebSocket.
     */

    if (websocketRef.current) {
      try {
        websocketRef.current.close();
      } catch {
        // Already closed.
      }

      websocketRef.current =
        null;
    }

    wsConnectedRef.current =
      false;

    stopTimer();

    setIsRecording(false);

    setMicrophoneStatus('OFF');

    setSpeechStatus('STANDBY');

    setConnectionStatus('OFFLINE');

    setDuration(0);

    recordingStartRef.current =
      null;
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopEverything();
    } else {
      void startMonitoring();
    }
  };

  /*
   * ---------------------------------------------------------
   * RISK COLOR
   * ---------------------------------------------------------
   */

  const riskChartColor =
    riskScore > 60
      ? '#EF4444'
      : '#3B82F6';

  /*
   * ---------------------------------------------------------
   * RECOMMENDED ACTION
   * ---------------------------------------------------------
   */

  const displayedRecommendation =
    recommendation ||
    (riskLevel === 'CRITICAL'
      ? 'Do NOT share OTP, PIN, credentials or transfer money. Terminate the interaction immediately and independently verify the caller.'
      : riskLevel === 'HIGH'
      ? 'Do not share sensitive information. Verify the caller through an independent trusted channel.'
      : 'Conversation appears normal. Continue with standard security hygiene.');

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

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
              onChange={(event) =>
                setSelectedSpeakerId(
                  event.target.value
                )
              }
              disabled={isRecording}
              className="bg-[#192233] border border-[#26334D] text-xs font-bold text-blue-400 rounded px-2.5 py-1 focus:outline-none disabled:opacity-50"
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
                    {profile.speaker_id} (
                    {profile.name})
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

          {/* Waveform */}
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

          {/* Voice Metrics */}
          <div className="bg-[#121824] border border-[#26334D] rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono border-b border-[#26334D] pb-2">
              Voice Authenticity Metrics
            </h3>

            {/* AI Voice Probability */}
            <div className="flex items-center justify-between bg-[#192233] p-3 rounded-lg border border-[#26334D]">
              <div>
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
                className={`px-2.5 py-1 text-xs font-bold rounded ${
                  synthProb >
                  0.6
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {synthProb >
                0.6
                  ? 'SYNTHETIC'
                  : 'REAL HUMAN'}
              </div>
            </div>

            {/* Speaker Match */}
            <div className="flex items-center justify-between bg-[#192233] p-3 rounded-lg border border-[#26334D]">
              <div>
                <div className="text-xs text-gray-400">
                  Speaker Biometric Match
                </div>

                <div className="text-lg font-bold font-mono text-white">
                  {speakerSimilarity ===
                  null
                    ? '--'
                    : `${(
                        speakerSimilarity *
                        100
                      ).toFixed(0)}%`}
                </div>
              </div>

              <div
                className={`px-2.5 py-1 text-xs font-bold rounded ${
                  speakerStatus ===
                  'MATCH'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : speakerStatus ===
                      'NOT ENROLLED'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {speakerStatus}
              </div>
            </div>

            {/* Context */}
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

          {/* Risk Gauge */}
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
                  : riskLevel ===
                    'MEDIUM'
                  ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
              }`}
            >
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />

              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  RECOMMENDED ACTION:
                </div>

                <div className="text-xs mt-1 leading-relaxed">
                  {displayedRecommendation}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
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
                  data={
                    timelineData
                  }
                >
                  <XAxis
                    dataKey="time"
                    stroke="#4B5563"
                    tick={{
                      fontSize: 10,
                    }}
                  />

                  <YAxis
                    domain={[
                      0,
                      100,
                    ]}
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
                      riskChartColor
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

            {/* System status */}
            <div className="mb-4 grid grid-cols-3 gap-2">

              <div className="bg-[#192233] border border-[#26334D] rounded-lg p-2">
                <div className="text-[9px] text-gray-500 font-mono">
                  MIC
                </div>

                <div
                  className={`text-[10px] font-bold ${
                    microphoneStatus ===
                    'ACTIVE'
                      ? 'text-emerald-400'
                      : 'text-gray-400'
                  }`}
                >
                  {microphoneStatus}
                </div>
              </div>

              <div className="bg-[#192233] border border-[#26334D] rounded-lg p-2">
                <div className="text-[9px] text-gray-500 font-mono">
                  STT
                </div>

                <div
                  className={`text-[10px] font-bold ${
                    speechStatus ===
                    'LISTENING'
                      ? 'text-emerald-400'
                      : 'text-gray-400'
                  }`}
                >
                  {speechStatus}
                </div>
              </div>

              <div className="bg-[#192233] border border-[#26334D] rounded-lg p-2">
                <div className="text-[9px] text-gray-500 font-mono">
                  AI
                </div>

                <div
                  className={`text-[10px] font-bold ${
                    connectionStatus ===
                    'CONNECTED'
                      ? 'text-emerald-400'
                      : connectionStatus ===
                        'ERROR'
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}
                >
                  {connectionStatus}
                </div>
              </div>

            </div>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">

              {transcriptUtterances.length ===
              0 ? (
                <div className="bg-[#192233] p-4 rounded-lg border border-[#26334D] text-center">
                  <Mic className="w-5 h-5 text-gray-500 mx-auto mb-2" />

                  <p className="text-xs text-gray-500">
                    {isRecording
                      ? 'Listening for speech...'
                      : 'Start the microphone monitor to begin live transcription.'}
                  </p>
                </div>
              ) : (
                transcriptUtterances.map(
                  (utterance) => (
                    <div
                      key={
                        utterance.id
                      }
                      className="bg-[#192233] p-3 rounded-lg border border-[#26334D] space-y-2"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                        <span className="font-bold text-blue-400">
                          {
                            utterance.speaker
                          }
                        </span>

                        <span>
                          16kHz Mono
                        </span>
                      </div>

                      <p className="text-xs text-gray-200 leading-relaxed font-sans">
                        {
                          utterance.text
                        }
                      </p>

                      {utterance.flags &&
                        utterance
                          .flags
                          .length >
                          0 && (
                          <div className="flex flex-wrap gap-1">
                            {utterance.flags.map(
                              (
                                flag,
                                index
                              ) => (
                                <span
                                  key={`${flag}-${index}`}
                                  className="text-[9px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20"
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
