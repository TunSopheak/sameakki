import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Brand } from './Brand';
import { Loader2, LogIn, UserPlus } from 'lucide-react';

const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40 focus:border-brand';

export const AuthScreen: React.FC = () => {
  const { login, register, t, language, setLanguage } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', nameKm: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(form.email.trim(), form.password);
      } else {
        await register({
          name: form.name.trim(),
          nameKm: form.nameKm.trim() || undefined,
          email: form.email.trim(),
          password: form.password,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <Brand />
          <button
            onClick={() => setLanguage(language === 'km' ? 'en' : 'km')}
            className="text-xs font-bold px-2 py-1 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 cursor-pointer"
          >
            {language === 'km' ? '🇬🇧 EN' : '🇰🇭 ខ្មែរ'}
          </button>
        </div>

        <div className="animate-rise bg-white rounded-xl border border-neutral-200 shadow-xs p-6">
          <h1 className="text-lg font-bold text-black">{mode === 'login' ? t.authWelcome : t.signUp}</h1>
          <p className="text-xs text-neutral-500 mt-1 mb-5 min-h-4">{mode === 'login' ? t.authSubtitle : ''}</p>

          {error && (
            <div role="alert" className="mb-4 p-3 text-xs rounded-lg border border-brand bg-neutral-100 text-black font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-xs font-bold text-black mb-1">{t.memberName} *</span>
                    <input required value={form.name} onChange={update('name')} autoComplete="name" className={inputClass} />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-bold text-black mb-1">
                      {language === 'km' ? 'ឈ្មោះជាភាសាខ្មែរ' : 'Khmer name'}
                    </span>
                    <input value={form.nameKm} onChange={update('nameKm')} className={inputClass} />
                  </label>
                </div>
              </>
            )}

            <label className="block">
              <span className="block text-xs font-bold text-black mb-1">
                {mode === 'login' ? t.emailOrUsername : t.memberEmail} *
              </span>
              <input
                type={mode === 'login' ? 'text' : 'email'}
                required
                value={form.email}
                onChange={update('email')}
                autoComplete={mode === 'login' ? 'username' : 'email'}
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
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={inputClass}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-sm font-semibold rounded-lg cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'login' ? (
                <LogIn className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>{mode === 'login' ? t.signIn : t.signUp}</span>
            </button>
          </form>

          <p className="text-xs text-neutral-600 text-center mt-5">
            {mode === 'login' ? t.noAccount : t.haveAccount}{' '}
            <button onClick={switchMode} className="font-bold text-black hover:underline cursor-pointer">
              {mode === 'login' ? t.signUp : t.signIn}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
