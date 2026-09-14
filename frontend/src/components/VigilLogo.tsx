'use client';

import React from 'react';
import Image from 'next/image';

interface VigilLogoProps {
  size?: number;
  className?: string;
}

const VigilLogo: React.FC<VigilLogoProps> = ({
  size = 42,
  className = '',
}) => {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <Image
        src="/VIGIL.png"
        alt="VIGIL"
        width={size}
        height={size}
        priority
        unoptimized
        className="block w-full h-full object-contain"
      />
    </div>
  );
};

export default VigilLogo;
