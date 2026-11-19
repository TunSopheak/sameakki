import { useEscape } from '../lib/useEscape';
import { createPortal } from 'react-dom';
import React, { useState } from 'react';
import { AVATAR_ERAS, BOY_AVATARS, GIRL_AVATARS, type AvatarKey } from '@shared/avatars';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import { Icons } from './icons';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// The first five of each are the first set; the others are Khmer people through the ages
const FIRST_SET = 5;

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateAvatar, language, t } = useApp();
  // Who the pointer or keyboard is on, written under the pictures
  const [hint, setHint] = useState<AvatarKey | null>(null);
  useEscape(isOpen, onClose);
  if (!isOpen) return null;

  const choose = async (key: AvatarKey) => {
    try {
      await updateAvatar(key);
      onClose();
    } catch {
    }
  };

  const eraName = (key: AvatarKey) => AVATAR_ERAS[key]?.[language === 'km' ? 'km' : 'en'];

  const grid = (keys: readonly AvatarKey[]) => (
    <div className="grid grid-cols-5 gap-2">
      {keys.map(key => {
        const selected = currentUser.avatar === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => choose(key)}
            onMouseEnter={() => setHint(key)}
            onMouseLeave={() => setHint(null)}
            onFocus={() => setHint(key)}
            onBlur={() => setHint(null)}
            aria-pressed={selected}
            aria-label={eraName(key) ?? key}
            title={eraName(key)}
            className={`relative cursor-pointer rounded-full p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-brand ${
              selected ? 'ring-2 ring-brand' : 'ring-1 ring-neutral-200'
            }`}
          >
            <Avatar name={currentUser.name} avatar={key} className="aspect-square w-full" />
            {selected && (
              <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-brand text-white">
                <Icons.confirm className="size-3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const group = (title: string, keys: readonly AvatarKey[]) => (
    <div>
      <p className="mb-2 text-xs font-semibold text-neutral-500">{title}</p>
      {grid(keys.slice(0, FIRST_SET))}
      <p className="mb-2 mt-3 text-[11px] font-semibold text-neutral-400">{t.avatarKhmerAges}</p>
      {grid(keys.slice(FIRST_SET))}
    </div>
  );

  // Shown on <body> so the sidebar does not trap it
  return createPortal(
      <div className="modal-overlay fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-2xs sm:items-center sm:p-4">
        <div className="modal-panel flex max-h-[92vh] w-full max-w-sm flex-col rounded-t-2xl border border-neutral-200 bg-white shadow-2xl sm:rounded-xl">
          <div className="flex items-center justify-between px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
            <h2 className="text-base font-bold text-black">{t.chooseAvatar}</h2>
            <button onClick={onClose} aria-label={t.cancel} className="cursor-pointer rounded p-1 text-neutral-400 hover:text-black">
              <Icons.close className="size-5" />
            </button>
          </div>
          <div className="space-y-5 overflow-y-auto px-5 pb-3 sm:px-6">
            {group(t.boys, BOY_AVATARS)}
            {group(t.girls, GIRL_AVATARS)}
          </div>
          <p className="min-h-9 border-t border-neutral-100 px-5 py-2 text-center text-xs font-semibold text-neutral-600 sm:px-6">
            {(hint && eraName(hint)) || t.avatarHint}
          </p>
        </div>
      </div>,
    document.body
  );
};
