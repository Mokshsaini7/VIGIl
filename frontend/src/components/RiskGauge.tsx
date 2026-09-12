'use client';

import React from 'react';

interface RiskGaugeProps {
  score: number;
  level: string;
  size?: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, level, size = 180 }) => {
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  let strokeColor = "#10B981"; // LOW
  let badgeBg = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";

  if (level === "GUARDED") {
    strokeColor = "#F59E0B";
    badgeBg = "bg-amber-500/20 text-amber-400 border-amber-500/30";
  } else if (level === "MODERATE") {
    strokeColor = "#F97316";
    badgeBg = "bg-orange-500/20 text-orange-400 border-orange-500/30";
  } else if (level === "HIGH") {
    strokeColor = "#EF4444";
    badgeBg = "bg-red-500/20 text-red-400 border-red-500/30";
  } else if (level === "CRITICAL") {
    strokeColor = "#DC2626";
    badgeBg = "bg-red-600/30 text-red-400 border-red-500/50 animate-pulse";
  }

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#26334D"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-extrabold text-white tracking-tight font-mono">{score}</span>
        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">/ 100</span>
      </div>
      <div className={`mt-3 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${badgeBg}`}>
        {level} RISK
      </div>
    </div>
  );
};
