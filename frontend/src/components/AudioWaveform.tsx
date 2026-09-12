'use client';

import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isRecording: boolean;
  color?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ isRecording, color = "#3B82F6" }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isRecording ? color : "#4B5563";

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      for (let x = 0; x < width; x++) {
        const amplitude = isRecording ? Math.sin((x * 0.03) + phase) * 18 + Math.cos((x * 0.08) - phase) * 10 : 2;
        const y = centerY + amplitude;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      phase += isRecording ? 0.15 : 0.02;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRecording, color]);

  return (
    <div className="w-full bg-[#0B0F17] rounded-lg p-2 border border-[#26334D]">
      <canvas ref={canvasRef} width={600} height={80} className="w-full h-20 rounded" />
    </div>
  );
};
