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
  /** Skin colour, when it is not the first set's */
  skin?: string;
  /** Behind the head: long hair, a bun, wings of a crown */
  back?: React.ReactNode;
  /** Instead of the plain shirt */
  body?: React.ReactNode;
  /** On the head: hair, crowns, hats */
  front?: React.ReactNode;
  /** On top of everything: jewellery, glasses, collars */
  over?: React.ReactNode;
}

const SKIN = '#f3c9a0';
const BLACK = '#2b2220';
const BROWN = '#6b4332';
const BRAND = '#840015';
const GOLD = '#f2b83d';
const GOLD_DARK = '#c8871b';
const RED = '#c0392b';

const shortHair = (color: string) => (
  <path d="M17 32c0-10 7-17 15-17s15 7 15 17c-3-6-8-8-15-8s-12 2-15 8z" fill={color} />
);
const fringe = (color: string) => (
  <path d="M17 33c1-10 8-14 15-14s14 4 15 14c-5-4-9-7-15-7s-10 3-15 7z" fill={color} />
);
const longHair = (color: string) => <path d="M14 34c0-14 7-21 18-21s18 7 18 21v22H14z" fill={color} />;

// Small pieces used by the Khmer avatars
const earrings = (y = 41, color = GOLD) => (
  <g fill={color}>
    <circle cx="16.5" cy={y} r="2.1" />
    <circle cx="47.5" cy={y} r="2.1" />
  </g>
);
const necklace = (color = GOLD) => (
  <g fill="none" stroke={color} strokeLinecap="round">
    <path d="M21 51q11 9 22 0" strokeWidth="2.2" />
    <path d="M24 50q8 6 16 0" strokeWidth="1.4" />
    <circle cx="32" cy="57.4" r="1.7" fill="#d6405f" stroke="none" />
  </g>
);
const flower = (x: number, y: number, petal = '#ff8fb1') => (
  <g transform={`translate(${x} ${y})`}>
    {[0, 72, 144, 216, 288].map(deg => (
      <circle key={deg} cx="0" cy="-3.2" r="2.5" fill={petal} transform={`rotate(${deg})`} />
    ))}
    <circle r="1.8" fill="#ffd23f" />
  </g>
);
const roundGlasses = (color: string) => (
  <g fill="none" stroke={color} strokeWidth="1.4">
    <circle cx="26" cy="36" r="4.8" />
    <circle cx="38" cy="36" r="4.8" />
    <path d="M30.8 36h2.4" />
  </g>
);

const STICKERS: Record<AvatarKey, Sticker> = {
  // ---- The first set
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
        {flower(46, 21)}
      </>
    ),
  },

  // ---- Khmer men through the ages
  // Funan (Nokor Phnom): bare chest, gold necklace, a topknot and a gold headband
  m6: {
    bg: '#bfe6ea',
    shirt: '#e0a574',
    skin: '#e0a574',
    back: <circle cx="32" cy="13" r="7.5" fill={BLACK} />,
    front: (
      <>
        {shortHair(BLACK)}
        <path d="M18 28q14-7 28 0" fill="none" stroke={GOLD} strokeWidth="2.6" strokeLinecap="round" />
      </>
    ),
    over: (
      <>
        {earrings()}
        {necklace()}
      </>
    ),
  },
  // Chenla: bare chest with a red sash, a side bun, big gold ear ornaments
  m7: {
    bg: '#d6e8c4',
    shirt: '#d9a066',
    skin: '#d9a066',
    back: <circle cx="48" cy="21" r="6" fill={BLACK} />,
    front: (
      <>
        {shortHair(BLACK)}
        <circle cx="47" cy="23" r="1.6" fill={GOLD} />
      </>
    ),
    over: (
      <>
        <path d="M13 62l9-11 30 11z" fill="#c43b3b" />
        <path d="M13 62l9-11 4 1-6 10z" fill="#a52a2a" />
        <circle cx="16.5" cy="41.5" r="2.9" fill={GOLD} />
        <circle cx="47.5" cy="41.5" r="2.9" fill={GOLD} />
      </>
    ),
  },
  // Angkor king: a tall golden crown, a gold collar and a red robe
  m8: {
    bg: '#f6d7a0',
    shirt: '#8a1c2b',
    skin: '#e2ac7c',
    front: (
      <>
        {shortHair(BLACK)}
        <path d="M26 25l6-21 6 21z" fill={GOLD} />
        <path d="M19 25l4-12 5 12zM36 25l5-12 4 12z" fill={GOLD_DARK} />
        <rect x="17" y="24" width="30" height="4.2" rx="1.6" fill={GOLD} />
        <circle cx="32" cy="26.2" r="1.7" fill="#d6405f" />
      </>
    ),
    over: (
      <>
        {earrings(42)}
        <path d="M18 52q14 11 28 0l3 4q-17 15-34 0z" fill={GOLD} />
        <circle cx="32" cy="60" r="2" fill="#d6405f" />
      </>
    ),
  },
  // Bayon warrior: a bronze helmet with a red plume and a gold strap across the armour
  m9: {
    bg: '#c9d3dd',
    shirt: '#7b5a2e',
    skin: '#d9a066',
    front: (
      <>
        <path d="M32 11q9-9 15-1-6 0-9 6z" fill={RED} />
        <path d="M17 29c0-12 7-20 15-20s15 8 15 20z" fill="#8c6a35" />
        <rect x="16" y="27" width="32" height="3.6" rx="1.5" fill="#c9a24a" />
        <path d="M32 13v14" stroke="#c9a24a" strokeWidth="1.6" />
      </>
    ),
    over: <path d="M13 62l10-11 5 1-9 12z" fill="#c9a24a" />,
  },
  // Angkor farmer: a red krama wrapped on the head
  m10: {
    bg: '#d7ecc2',
    shirt: '#4d6b3a',
    skin: '#d19a5f',
    front: (
      <>
        <path d="M16 31c0-10 7-16 16-16s16 6 16 16c-5-4-10-6-16-6s-11 2-16 6z" fill={RED} />
        <path d="M21 21l7 5M29 17l7 7M37 17l7 7" stroke="#fff" strokeWidth="1.5" opacity="0.7" />
        <path d="M45 24l9 7-7 2z" fill={RED} />
      </>
    ),
  },
  // Oudong court: a short golden spire hat and a royal blue jacket with gold trim
  m11: {
    bg: '#e1d3f0',
    shirt: '#1f3f7a',
    skin: '#e2ac7c',
    front: (
      <>
        {shortHair(BLACK)}
        <path d="M20 28c0-8 5-14 12-23 7 9 12 15 12 23z" fill={GOLD} />
        <rect x="19" y="26" width="26" height="3.6" rx="1.5" fill={GOLD_DARK} />
      </>
    ),
    over: (
      <>
        {earrings(42)}
        <path d="M25 50l7 11 7-11" fill="none" stroke={GOLD} strokeWidth="2" />
        <circle cx="32" cy="63" r="1.2" fill={GOLD} />
      </>
    ),
  },
  // 1900s: parted hair, round glasses, a moustache, a bow tie
  m12: {
    bg: '#ead9bd',
    shirt: '#f5f1e8',
    front: (
      <>
        <path d="M17 32c0-12 7-18 15-18s15 6 15 18c-2-5-6-8-10-9-4 2-8 4-13 4-3 0-5 1-7 5z" fill={BLACK} />
        <path d="M27 42q5-2.6 10 0q-5 2.2-10 0z" fill={BLACK} />
      </>
    ),
    over: (
      <>
        <path d="M8 64c0-10 10-14 24-14l-6 14zM56 64c0-10-10-14-24-14l6 14z" fill="#33302c" />
        <path d="M26.5 53l5.5 2.7-5.5 2.7zM37.5 53l-5.5 2.7 5.5 2.7z" fill="#1a1a1a" />
        <circle cx="32" cy="55.7" r="1.6" fill="#1a1a1a" />
        {roundGlasses('#6b4a2b')}
      </>
    ),
  },
  // 1960s: a quiff, sunglasses and a bright shirt with big collar points
  m13: {
    bg: '#bfe9e1',
    shirt: '#e86f4d',
    front: (
      <>
        <path d="M16 32c-1-12 6-19 16-19 9 0 17 6 16 19-3-6-7-9-11-9-6-6-14-4-21 9z" fill={BLACK} />
        <ellipse cx="26" cy="15" rx="9" ry="5" fill={BLACK} />
      </>
    ),
    over: (
      <>
        <path d="M24 50l8 8-3 6-9-8zM40 50l-8 8 3 6 9-8z" fill="#fff6e8" />
        <g fill="#1a1a1a">
          <rect x="20" y="33" width="10" height="6.5" rx="2.5" />
          <rect x="34" y="33" width="10" height="6.5" rx="2.5" />
        </g>
        <path d="M30 35h4" stroke="#1a1a1a" strokeWidth="1.5" />
      </>
    ),
  },
  // Student today: messy hair, headphones, a hoodie
  m14: {
    bg: '#d7e3ff',
    shirt: '#3b5bdb',
    back: <path d="M12 56c0-8 6-12 20-12s20 4 20 12z" fill="#2f49b0" />,
    front: (
      <>
        {shortHair(BROWN)}
        <path d="M21 17l3 5M30 14l1 6M41 16l-3 5" stroke={BROWN} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M15 35c0-13 7-20 17-20s17 7 17 20" fill="none" stroke="#222" strokeWidth="2.6" />
        <rect x="11.5" y="32" width="6.5" height="11" rx="3" fill="#e03131" />
        <rect x="46" y="32" width="6.5" height="11" rx="3" fill="#e03131" />
      </>
    ),
    over: <path d="M28 52v8M36 52v8" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />,
  },
  // Professional today: a shirt, a tie, and a red krama over the shoulders
  m15: {
    bg: '#e8e8ee',
    shirt: '#f4f4f6',
    front: <path d="M17 31c0-11 7-17 15-17s15 6 15 17c-3-5-6-7-9-8-6 3-14 3-21 8z" fill={BLACK} />,
    over: (
      <>
        <path d="M8 64c0-9 9-13 24-13l-4 13zM56 64c0-9-9-13-24-13l4 13z" fill={RED} />
        <path d="M13 59l8 4M51 59l-8 4M17 55l7 4M47 55l-7 4" stroke="#fff" strokeWidth="1.3" opacity="0.8" />
        <path d="M30 51h4l2 10-4 3-4-3z" fill="#1c2b4a" />
      </>
    ),
  },

  // ---- Khmer women through the ages
  // Queen Soma of Funan: a high bun, a gold band, a flower and a gold necklace
  f6: {
    bg: '#b9e3ec',
    shirt: '#3aa6b9',
    skin: '#e8b88a',
    back: (
      <>
        {longHair(BLACK)}
        <circle cx="32" cy="11" r="7.5" fill={BLACK} />
      </>
    ),
    front: (
      <>
        {fringe(BLACK)}
        <path d="M18 26q14-8 28 0" fill="none" stroke={GOLD} strokeWidth="2.6" strokeLinecap="round" />
        {flower(40, 10, '#fff')}
      </>
    ),
    over: (
      <>
        {earrings()}
        {necklace()}
      </>
    ),
  },
  // Chenla lady: long hair, a gold headband, a red wrapped top
  f7: {
    bg: '#e5e0b8',
    shirt: '#b8312f',
    skin: '#d9a066',
    back: longHair(BLACK),
    front: (
      <>
        {fringe(BLACK)}
        <path d="M18 29q14-9 28 0" fill="none" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="32" cy="22" r="1.8" fill="#d6405f" />
      </>
    ),
    over: (
      <>
        {earrings(42)}
        <path d="M22 52q10 5 20 0" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
  // Angkor queen: a crown with spires, long earrings, a broad gold collar
  f8: {
    bg: '#f7c9a8',
    shirt: '#1f7a74',
    skin: '#e8b88a',
    back: longHair(BLACK),
    front: (
      <>
        {fringe(BLACK)}
        <path d="M19 26l3-10 5 7 5-14 5 14 5-7 3 10z" fill={GOLD} />
        <rect x="18" y="25" width="28" height="3.6" rx="1.5" fill={GOLD_DARK} />
        <circle cx="32" cy="26.8" r="1.6" fill="#d6405f" />
      </>
    ),
    over: (
      <>
        <path d="M17 40v8M47 40v8" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
        <circle cx="17" cy="49.5" r="2.2" fill="#d6405f" />
        <circle cx="47" cy="49.5" r="2.2" fill="#d6405f" />
        <path d="M19 52q13 10 26 0l2 4q-15 13-30 0z" fill={GOLD} />
      </>
    ),
  },
  // Apsara: a tall tiered headdress with wings, bare shoulders, a gold collar
  f9: {
    bg: '#f1d9b5',
    shirt: '#e8b88a',
    skin: '#e8b88a',
    back: (
      <>
        {longHair(BLACK)}
        <path d="M17 30q-7-3-5-13 4 4 8 8zM47 30q7-3 5-13-4 4-8 8z" fill={GOLD_DARK} />
      </>
    ),
    front: (
      <>
        {fringe(BLACK)}
        <path d="M26 25l6-22 6 22z" fill={GOLD} />
        <path d="M19 26l5-12 5 12zM35 26l5-12 5 12z" fill={GOLD_DARK} />
        <rect x="18" y="25" width="28" height="3.6" rx="1.5" fill={GOLD} />
        {flower(32, 6, '#fff')}
      </>
    ),
    over: (
      <>
        {earrings(42)}
        <path d="M18 52q14 10 28 0l1 3q-15 12-30 0z" fill={GOLD} />
        <path d="M8 64l10-8 5 8z" fill="#2b6cb0" />
      </>
    ),
  },
  // Angkor villager: a low bun with a flower, a plain cloth top
  f10: {
    bg: '#d6ecc9',
    shirt: '#8b5e3c',
    skin: '#d19a5f',
    back: <circle cx="15" cy="42" r="7.2" fill={BROWN} />,
    front: (
      <>
        {fringe(BROWN)}
        {flower(18, 34, '#fff')}
      </>
    ),
    over: <path d="M22 52q10 4 20 0" fill="none" stroke="#f1e2c6" strokeWidth="2" strokeLinecap="round" />,
  },
  // Oudong royal dancer: a slim golden spire, gold wings, a red silk top
  f11: {
    bg: '#e8d5f2',
    shirt: '#c0392b',
    back: (
      <>
        {longHair(BLACK)}
        <path d="M16 30c-6-3-7-9-4-14 1 5 4 8 8 10zM48 30c6-3 7-9 4-14-1 5-4 8-8 10z" fill={GOLD_DARK} />
      </>
    ),
    front: (
      <>
        {fringe(BLACK)}
        <path d="M27 26l5-25 5 25z" fill={GOLD} />
        <rect x="19" y="25" width="26" height="3.4" rx="1.5" fill={GOLD} />
        <circle cx="32" cy="26.7" r="1.5" fill="#d6405f" />
      </>
    ),
    over: (
      <>
        {earrings(42)}
        <path d="M8 64c0-4 3-7 6-9l6 9z" fill={GOLD} />
      </>
    ),
  },
  // 1900s: a big pouf of hair with a ribbon, and a lace collar
  f12: {
    bg: '#efd8d8',
    shirt: '#f7efe4',
    back: <ellipse cx="32" cy="17" rx="18" ry="12" fill={BROWN} />,
    front: (
      <>
        {fringe(BROWN)}
        <path d="M44 14l8-3-3 9zM44 14l-3 9 9-1z" fill="#d6577f" />
      </>
    ),
    over: (
      <>
        <path d="M23 50h18v5q-9 6-18 0z" fill="#fff" />
        <g fill="#d9c9b0">
          <circle cx="27" cy="53" r="0.9" />
          <circle cx="32" cy="55" r="0.9" />
          <circle cx="37" cy="53" r="0.9" />
        </g>
        <circle cx="32" cy="49.6" r="1.6" fill="#d6577f" />
      </>
    ),
  },
  // 1960s: a beehive, a hairband, winged eyeliner, a pink dress
  f13: {
    bg: '#c7f0e0',
    shirt: '#ff8fb1',
    back: <ellipse cx="32" cy="14" rx="14" ry="13" fill={BLACK} />,
    front: (
      <>
        {fringe(BLACK)}
        <path d="M17 28q15-9 30 0" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      </>
    ),
    over: (
      <>
        <path d="M22.4 35.5l-3.2-2M41.6 35.5l3.2-2" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M23 50l9 7 9-7" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      </>
    ),
  },
  // Student today: a ponytail, red glasses, a white school blouse with a blue tie
  f14: {
    bg: '#d0ebff',
    shirt: '#ffffff',
    back: <path d="M44 21q14 4 9 27-3-13-10-16z" fill={BLACK} />,
    front: (
      <>
        {fringe(BLACK)}
        <circle cx="45" cy="24" r="2.3" fill="#e03131" />
      </>
    ),
    over: (
      <>
        {roundGlasses('#e03131')}
        <path d="M30 51h4l1.5 9-3.5 3-3.5-3z" fill="#1c4a8a" />
      </>
    ),
  },
  // Bride or professional today: a sleek bun with a gold pin, a magenta silk shoulder cloth
  f15: {
    bg: '#fde8b8',
    shirt: '#f4d9a8',
    back: <circle cx="32" cy="13" r="8" fill={BLACK} />,
    front: (
      <>
        {shortHair(BLACK)}
        <path d="M40 10l10-6" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" />
        {flower(38, 9, '#fff')}
      </>
    ),
    over: (
      <>
        {earrings(42)}
        <path d="M8 64c0-8 8-13 20-14l9 14z" fill="#c2255c" />
        <path d="M8 64c0-2 0-4 1-6l8 6z" fill={GOLD} />
        <path d="M25 51q7 5 14 0" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
};

const Face: React.FC<{ skin: string }> = ({ skin }) => (
  <>
    <circle cx="17.5" cy="37" r="3" fill={skin} />
    <circle cx="46.5" cy="37" r="3" fill={skin} />
    <circle cx="32" cy="35" r="15" fill={skin} />
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

  const { bg, shirt, skin = SKIN, back, front, over } = STICKERS[avatar];
  return (
    <svg viewBox="0 0 64 64" className={`shrink-0 rounded-full ${className}`} role="img" aria-label={name}>
      <rect width="64" height="64" fill={bg} />
      {back}
      <rect x="28" y="44" width="8" height="9" fill={skin} />
      <rect x="28" y="44" width="8" height="9" fill="#000" opacity="0.1" />
      {STICKERS[avatar].body ?? <path d="M8 64c0-10 10-14 24-14s24 4 24 14z" fill={shirt} />}
      <Face skin={skin} />
      {front}
      {over}
    </svg>
  );
};
