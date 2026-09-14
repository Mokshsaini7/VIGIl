'use client';

import React from 'react';

interface VigilLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: boolean;
  className?: string;
  imageClassName?: string;
}

const sizeMap = {
  xs: {
    image: 'w-7 h-7',
    title: 'text-sm',
    subtitle: 'text-[8px]',
  },
  sm: {
    image: 'w-8 h-8',
    title: 'text-base',
    subtitle: 'text-[8px]',
  },
  md: {
    image: 'w-10 h-10',
    title: 'text-lg',
    subtitle: 'text-[9px]',
  },
  lg: {
    image: 'w-14 h-14',
    title: 'text-xl',
    subtitle: 'text-[10px]',
  },
  xl: {
    image: 'w-20 h-20',
    title: 'text-3xl',
    subtitle: 'text-xs',
  },
};

export const VigilLogo: React.FC<VigilLogoProps> = ({
  size = 'md',
  showText = true,
  subtitle = true,
  className = '',
  imageClassName = '',
}) => {
  const sizes = sizeMap[size];

  return (
    <div
      className={`flex items-center min-w-0 ${className}`}
    >
      <img
        src="public/VIGIL.png"
        alt="VIGIL — Voice Integrity & Impersonation Guard"
        className={`
          ${sizes.image}
          object-contain
          flex-shrink-0
          select-none
          ${imageClassName}
        `}
      />

      {showText && (
        <div className="ml-2.5 min-w-0">
          <div
            className={`
              ${sizes.title}
              font-extrabold
              tracking-[0.12em]
              text-white
              leading-none
            `}
          >
            VIGIL
          </div>

          {subtitle && (
            <div
              className={`
                ${sizes.subtitle}
                text-gray-500
                mt-1
                leading-tight
                whitespace-nowrap
              `}
            >
              Voice Integrity &amp;
              <br />
              Impersonation Guard
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VigilLogo;
