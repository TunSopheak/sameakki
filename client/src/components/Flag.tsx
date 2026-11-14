import React from 'react';

interface FlagProps {
  code: 'km' | 'en';
  className?: string;
}

/** Flags are images because some devices show flag emoji as letters. */
export const Flag: React.FC<FlagProps> = ({ code, className = 'h-4' }) => {
  const shape = `inline-block aspect-[3/2] rounded-[2px] object-cover shadow-[0_0_0_1px_rgb(0_0_0/0.1)] ${className}`;

  if (code === 'km') {
    return <img src="/khmer/flag-of-cambodia.svg" alt="" aria-hidden="true" className={shape} />;
  }

  return (
    <svg viewBox="0 0 60 40" aria-hidden="true" className={shape} preserveAspectRatio="xMidYMid slice">
      <clipPath id="gb-cross">
        <path d="M30,20h30v20zv20h-30zh-30v-20zv-20h30z" />
      </clipPath>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0,0 60,40M60,0 0,40" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 60,40M60,0 0,40" clipPath="url(#gb-cross)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0v40M0,20h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0v40M0,20h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
};
