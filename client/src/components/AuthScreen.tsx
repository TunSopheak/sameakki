import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { telegramLink } from '../lib/contact';
import { Brand } from './Brand';
import { PreferenceToggles } from './PreferenceToggles';
import { ArrowLeft, Compass, Loader2, LogIn, Send } from 'lucide-react';

const inputClass =
  'w-full px-3 py-2 text-sm text-black bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40 focus:border-brand';

export const AuthScreen: React.FC = () => {
  const { login, enterDemo, t, language } = useApp();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center px-4 pb-8 pt-10 sm:p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <Brand />
          <PreferenceToggles />
        </div>

        <a
          href="#"
          onClick={e => {
            e.preventDefault();
            window.location.hash = '';
          }}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-black"
        >
          <ArrowLeft className="size-3.5" />
          {language === 'km' ? 'ត្រឡប់ទៅទំព័រដើម' : 'Back to home'}
        </a>

        <div className="animate-rise bg-white rounded-xl border border-neutral-200 shadow-xs p-6">
          <h1 className="text-lg font-bold text-black">{t.authWelcome}</h1>
          <p className="text-xs text-neutral-500 mt-1 mb-5">{t.authSubtitle}</p>

          {error && (
            <div role="alert" className="mb-4 p-3 text-xs rounded-lg border border-brand bg-neutral-100 text-black font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="block text-xs font-bold text-black mb-1">{t.emailOrUsername} *</span>
              <input
                type="text"
                required
                value={form.email}
                onChange={update('email')}
                autoComplete="username"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="block text-xs font-bold text-black mb-1">{t.password} *</span>
              <input
                type="password"
                required
                value={form.password}
                onChange={update('password')}
                autoComplete="current-password"
                className={inputClass}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-sm font-semibold rounded-lg cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>{t.signIn}</span>
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={enterDemo}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 border border-neutral-200 bg-white hover:bg-neutral-100 text-black text-sm font-semibold rounded-lg cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>{t.exploreDemo}</span>
            </button>
            <p className="text-center text-[11px] text-neutral-500">{t.exploreHint}</p>

            <p className="pt-2 text-center text-xs text-neutral-600">{t.authNoSignup}</p>
            <a
              href={telegramLink(t.telegramMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold rounded-lg"
            >
              <Send className="w-4 h-4" />
              <span>{t.contactTelegram}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
