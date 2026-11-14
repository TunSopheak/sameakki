import { createPortal } from 'react-dom';
import React from 'react';
import { BOY_AVATARS, GIRL_AVATARS, type AvatarKey } from '@shared/avatars';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import { Icons } from './icons';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateAvatar, t } = useApp();
  if (!isOpen) return null;

  const choose = async (key: AvatarKey) => {
    try {
      await updateAvatar(key);
      onClose();
    } catch {
    }
  };

  const group = (title: string, keys: readonly AvatarKey[]) => (
    <div>
      <p className="mb-2 text-xs font-semibold text-neutral-500">{title}</p>
      <div className="grid grid-cols-5 gap-2">
        {keys.map(key => {
          const selected = currentUser.avatar === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => choose(key)}
              aria-pressed={selected}
              className={`relative rounded-full p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-brand ${
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
    </div>
  );

  // Shown on <body> so the sidebar does not trap it
  return createPortal(
      <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
        <div className="modal-panel w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-5 shadow-2xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-black">{t.chooseAvatar}</h2>
            <button onClick={onClose} aria-label={t.cancel} className="rounded p-1 text-neutral-400 hover:text-black">
              <Icons.close className="size-5" />
            </button>
          </div>
          <div className="space-y-4">
            {group(t.boys, BOY_AVATARS)}
            {group(t.girls, GIRL_AVATARS)}
          </div>
        </div>
      </div>,
    document.body
  );
};
