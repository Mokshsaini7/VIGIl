'use client';

import React from 'react';
import Image from 'next/image';

interface LogoViewProps {
  size?: number;
  className?: string;
}

export const LogoView: React.FC<LogoViewProps> = ({
  size = 42,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <Image
        src="/VIGIL.png"
        alt="VIGIL Logo"
        width={size}
        height={size}
        priority
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default LogoView;
