import React from 'react';
import { isAvatarKey, type AvatarKey } from '@shared/avatars';

interface AvatarProps {
  name: string;
  avatar?: string;
  className?: string;
}

interface Sticker {
  bg: string;
  shirt: string;
  back?: React.ReactNode;
  front?: React.ReactNode;
}

const SKIN = '#f3c9a0';
const BLACK = '#2b2220';
const BROWN = '#6b4332';
const BRAND = '#840015';

const shortHair = (color: string) => (
  <path d="M17 32c0-10 7-17 15-17s15 7 15 17c-3-6-8-8-15-8s-12 2-15 8z" fill={color} />
);
const fringe = (color: string) => (
  <path d="M17 33c1-10 8-14 15-14s14 4 15 14c-5-4-9-7-15-7s-10 3-15 7z" fill={color} />
);

const STICKERS: Record<AvatarKey, Sticker> = {
  m1: { bg: '#cfe8f3', shirt: '#4b8fb3', front: shortHair(BLACK) },
  m2: {
    bg: '#fde7b0',
    shirt: BRAND,
    front: <path d="M17 32l2-14 5 6 3-11 5 8 5-8 3 11 5-6 2 14c-3-6-8-8-15-8s-12 2-15 8z" fill={BLACK} />,
  },
  m3: {
    bg: '#d9efd5',
    shirt: '#3f7d58',
    front: (
      <>
        {shortHair(BROWN)}
        <g fill="none" stroke={BLACK} strokeWidth="1.6">
          <circle cx="26" cy="36" r="5.2" />
          <circle cx="38" cy="36" r="5.2" />
          <path d="M31.2 36h1.6" />
        </g>
      </>
    ),
  },
  m4: {
    bg: '#fbd9d9',
    shirt: '#2a2a2e',
    front: (
      <>
        <path d="M17 30c0-9 7-15 15-15s15 6 15 15z" fill={BRAND} />
        <path d="M30 29h22c0 4-9 5-22 3z" fill="#5c0010" />
      </>
    ),
  },
  m5: {
    bg: '#e6dcf5',
    shirt: '#f0b429',
    front: (
      <g fill={BROWN}>
        <circle cx="20" cy="24" r="6" />
        <circle cx="26" cy="19" r="6" />
        <circle cx="32" cy="17" r="6" />
        <circle cx="38" cy="19" r="6" />
        <circle cx="44" cy="24" r="6" />
        <path d="M18 31c4-5 9-6 14-6s10 1 14 6c-5-1-9-2-14-2s-9 1-14 2z" />
      </g>
    ),
  },
  f1: {
    bg: '#fde0ec',
    shirt: '#d6577f',
    back: <path d="M14 34c0-14 7-21 18-21s18 7 18 21v22H14z" fill={BLACK} />,
    front: fringe(BLACK),
  },
  f2: {
    bg: '#d4ecf5',
    shirt: '#f08a5d',
    back: (
      <>
        <circle cx="13" cy="42" r="6.5" fill={BROWN} />
        <circle cx="51" cy="42" r="6.5" fill={BROWN} />
      </>
    ),
    front: (
      <>
        {fringe(BROWN)}
        <circle cx="16" cy="34" r="2.2" fill="#f0b429" />
        <circle cx="48" cy="34" r="2.2" fill="#f0b429" />
      </>
    ),
  },
  f3: {
    bg: '#fff1c2',
    shirt: '#7a5ac8',
    back: <path d="M14 38c0-15 7-23 18-23s18 8 18 23v8H14z" fill={BLACK} />,
    front: (
      <>
        {fringe(BLACK)}
        <g fill="#d6405f">
          <path d="M45 19l-7-4v8z" />
          <path d="M45 19l7-4v8z" />
          <circle cx="45" cy="19" r="2" />
        </g>
      </>
    ),
  },
  f4: {
    bg: '#dff3e4',
    shirt: '#2f9e8f',
    back: <circle cx="32" cy="11" r="7.5" fill={BROWN} />,
    front: shortHair(BROWN),
  },
  f5: {
    bg: '#fbe3d6',
    shirt: '#e8567a',
    back: <path d="M14 34c0-14 7-21 18-21s18 7 18 21c0 8-2 16-4 22H18c-2-6-4-14-4-22z" fill={BROWN} />,
    front: (
      <>
        {fringe(BROWN)}
        <g transform="translate(46 21)">
          {[0, 72, 144, 216, 288].map(deg => (
            <circle key={deg} cx="0" cy="-3.4" r="2.6" fill="#ff8fb1" transform={`rotate(${deg})`} />
          ))}
          <circle r="1.9" fill="#ffd23f" />
        </g>
      </>
    ),
  },
};

const Face: React.FC = () => (
  <>
    <circle cx="17.5" cy="37" r="3" fill={SKIN} />
    <circle cx="46.5" cy="37" r="3" fill={SKIN} />
    <circle cx="32" cy="35" r="15" fill={SKIN} />
    <g fill={BLACK}>
      <ellipse cx="26" cy="36" rx="2.1" ry="2.7" />
      <ellipse cx="38" cy="36" rx="2.1" ry="2.7" />
    </g>
    <g fill="#fff">
      <circle cx="26.8" cy="34.9" r="0.8" />
      <circle cx="38.8" cy="34.9" r="0.8" />
    </g>
    <g fill="#f08a8a" opacity="0.55">
      <ellipse cx="22.5" cy="42" rx="3" ry="1.8" />
      <ellipse cx="41.5" cy="42" rx="3" ry="1.8" />
    </g>
    <path d="M28.5 43.5q3.5 3.6 7 0" fill="none" stroke="#8a4b3c" strokeWidth="1.5" strokeLinecap="round" />
  </>
);

/** Sticker avatar, or the first letter of the name. */
export const Avatar: React.FC<AvatarProps> = ({ name, avatar, className = 'size-9' }) => {
  if (!isAvatarKey(avatar)) {
    return (
      <span className={`grid shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white ${className}`}>
        {name.charAt(0).toUpperCase() || '?'}
      </span>
    );
  }

  const { bg, shirt, back, front } = STICKERS[avatar];
  return (
    <svg viewBox="0 0 64 64" className={`shrink-0 rounded-full ${className}`} role="img" aria-label={name}>
      <rect width="64" height="64" fill={bg} />
      {back}
      <rect x="28" y="44" width="8" height="9" fill="#e0b088" />
      <path d="M8 64c0-10 10-14 24-14s24 4 24 14z" fill={shirt} />
      <Face />
      {front}
    </svg>
  );
};
