import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icons } from './icons';

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  capsWarning?: boolean;
};

/** Password field with an eye button to show or hide the text. */
export const PasswordInput: React.FC<PasswordInputProps> = ({ className = '', capsWarning, onKeyUp, onBlur, ...props }) => {
  const { t } = useApp();
  const [visible, setVisible] = useState(false);
  const [caps, setCaps] = useState(false);
  const label = visible ? t.hidePassword : t.showPassword;

  return (
    <div>
      <div className="relative">
        <input
          {...props}
          type={visible ? 'text' : 'password'}
          className={`${className} pr-10`}
          onKeyUp={e => {
            if (capsWarning) setCaps(e.getModifierState('CapsLock'));
            onKeyUp?.(e);
          }}
          onBlur={e => {
            setCaps(false);
            onBlur?.(e);
          }}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-label={label}
          title={label}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center text-neutral-400 hover:text-black"
        >
          {visible ? <Icons.eyeOff className="size-4" /> : <Icons.eye className="size-4" />}
        </button>
      </div>
      {caps && (
        <span role="status" className="mt-1 block text-[11px] font-medium text-brand-ink">
          {t.capsLockOn}
        </span>
      )}
    </div>
  );
};
