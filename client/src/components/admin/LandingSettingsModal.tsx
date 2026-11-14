import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LANDING_LIMITS, PRICE_TERMS, type PriceTerm } from '@shared/landing';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { Icons } from '../icons';

const fieldClass =
  'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-brand/40';

interface FormState {
  studentPrice: string;
  studentTerm: PriceTerm;
  studentNoteKm: string;
  studentNoteEn: string;
  maxMembers: string;
  pilotOffer: boolean;
  sponsors: { name: string; url: string }[];
}

/** Edit the plan and sponsors on the landing page. */
export const LandingSettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t, language } = useApp();
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .landingSettings()
      .then(s =>
        setForm({
          studentPrice: s.studentPrice,
          studentTerm: s.studentTerm,
          studentNoteKm: s.studentNoteKm,
          studentNoteEn: s.studentNoteEn,
          maxMembers: String(s.maxMembers),
          pilotOffer: s.pilotOffer,
          sponsors: s.sponsors.map(x => ({ name: x.name, url: x.url ?? '' })),
        })
      )
      .catch(err => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => (f ? { ...f, [key]: value } : f));

  const termLabel: Record<PriceTerm, string> = { semester: t.landingTermSemester, month: t.landingTermMonth, year: t.landingTermYear };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || saving) return;
    setError('');
    setSaving(true);
    try {
      await api.saveLandingSettings({
        studentPrice: form.studentPrice.trim(),
        studentTerm: form.studentTerm,
        studentNoteKm: form.studentNoteKm.trim(),
        studentNoteEn: form.studentNoteEn.trim(),
        maxMembers: Number(form.maxMembers),
        pilotOffer: form.pilotOffer,
        sponsors: form.sponsors.filter(s => s.name.trim() || s.url.trim()).map(s => ({ name: s.name.trim(), url: s.url.trim() || undefined })),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const previewNote = form ? (language === 'km' ? form.studentNoteKm : form.studentNoteEn) : '';

  return createPortal(
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
      <div className="modal-panel max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl border border-neutral-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between border-b border-neutral-200 pb-4">
          <div>
            <h2 className="text-base font-bold text-black">{t.adminLandingSettings}</h2>
            <p className="text-xs text-neutral-500">{t.landingHint}</p>
          </div>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-1 text-neutral-400 hover:text-black" aria-label={t.cancel}>
            <Icons.close className="size-5" />
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-brand bg-brand-soft p-3 text-xs font-medium text-brand">
            {error}
          </div>
        )}

        {!form ? (
          <div className="flex justify-center py-10 text-neutral-400">{error ? null : <Icons.loading className="size-5 animate-spin" />}</div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <fieldset className="space-y-4">
              <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">{t.landingStudentPlan}</legend>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-black">{t.landingPrice}</span>
                  <input value={form.studentPrice} maxLength={LANDING_LIMITS.price} onChange={e => set('studentPrice', e.target.value)} placeholder="$4" className={fieldClass} />
                  <span className="mt-1 block text-[11px] text-neutral-500">{t.landingPriceHint}</span>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-black">{t.landingTerm}</span>
                  <select value={form.studentTerm} onChange={e => set('studentTerm', e.target.value as PriceTerm)} className={fieldClass}>
                    {PRICE_TERMS.map(term => (
                      <option key={term} value={term}>
                        {termLabel[term]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-black">{t.landingNoteKm}</span>
                <input value={form.studentNoteKm} maxLength={LANDING_LIMITS.note} onChange={e => set('studentNoteKm', e.target.value)} className={fieldClass} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-black">{t.landingNoteEn}</span>
                <input value={form.studentNoteEn} maxLength={LANDING_LIMITS.note} onChange={e => set('studentNoteEn', e.target.value)} className={fieldClass} />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-black">{t.adminMaxMembers}</span>
                <input type="number" min={1} max={LANDING_LIMITS.maxMembers} required value={form.maxMembers} onChange={e => set('maxMembers', e.target.value)} className={fieldClass} />
                <span className="mt-1 block text-[11px] text-neutral-500">{t.landingMaxHint}</span>
              </label>

              <label className="flex cursor-pointer items-start gap-2.5">
                <input type="checkbox" checked={form.pilotOffer} onChange={e => set('pilotOffer', e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-brand)]" />
                <span>
                  <span className="block text-xs font-bold text-black">{t.landingPilot}</span>
                  <span className="block text-[11px] text-neutral-500">{t.landingPilotHint}</span>
                </span>
              </label>

              <div className="rounded-lg bg-neutral-50 p-3 text-xs">
                <p className="mb-1 font-semibold text-neutral-500">{t.landingPreview}</p>
                <p className="text-black">
                  <span className="text-xl font-bold">{form.studentPrice.trim() || t.landingAskPrice}</span>
                  {form.studentPrice.trim() && <span className="ml-1.5 text-neutral-500">{termLabel[form.studentTerm]}</span>}
                </p>
                {previewNote && <p className="mt-0.5 text-neutral-500">{previewNote}</p>}
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">{t.landingSponsors}</legend>
              <p className="text-[11px] text-neutral-500">{t.landingSponsorsHint}</p>

              {form.sponsors.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <input
                    value={s.name}
                    maxLength={LANDING_LIMITS.sponsorName}
                    onChange={e => set('sponsors', form.sponsors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    placeholder={t.landingSponsorName}
                    className={fieldClass}
                  />
                  <input
                    value={s.url}
                    maxLength={LANDING_LIMITS.url}
                    onChange={e => set('sponsors', form.sponsors.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                    placeholder="https://..."
                    className={fieldClass}
                  />
                  <button
                    type="button"
                    onClick={() => set('sponsors', form.sponsors.filter((_, j) => j !== i))}
                    aria-label={t.delete}
                    className="mt-2 shrink-0 cursor-pointer text-neutral-400 hover:text-black"
                  >
                    <Icons.remove className="size-4" />
                  </button>
                </div>
              ))}

              {form.sponsors.length < LANDING_LIMITS.sponsors && (
                <button
                  type="button"
                  onClick={() => set('sponsors', [...form.sponsors, { name: '', url: '' }])}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-black hover:underline"
                >
                  <Icons.add className="size-3.5" />
                  {t.landingAddSponsor}
                </button>
              )}
            </fieldset>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="cursor-pointer rounded-lg px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100">
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-dark disabled:opacity-60"
              >
                {t.adminSave}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
