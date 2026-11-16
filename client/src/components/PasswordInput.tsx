import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icons } from './icons';

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

/** Password field with an eye button to show or hide the text. */
export const PasswordInput: React.FC<PasswordInputProps> = ({ className = '', ...props }) => {
  const { t } = useApp();
  const [visible, setVisible] = useState(false);
  const label = visible ? t.hidePassword : t.showPassword;

  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className={`${className} pr-10`} />
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
  );
};
