import React from 'react';
import { useApp } from '../context/AppContext';
import { telegramLink } from '../lib/contact';
import { localDateOf } from '../lib/dates';
import { Icons } from './icons';

/** Banner for a plan that has ended (view only). */
export const PlanBanner: React.FC = () => {
  const { isReadOnly, groupFrozen, currentUser, t } = useApp();
  if (!isReadOnly && groupFrozen) {
    return (
      <div role="status" className="flex items-center gap-2 border-b border-brand bg-brand-soft px-4 py-2 text-xs font-medium text-brand print:hidden">
        <Icons.lock className="size-4 shrink-0" />
        <span>{t.planGroupEnded}</span>
      </div>
    );
  }
  if (!isReadOnly) return null;
  const locksAt = currentUser.plan?.locksAt;

  return (
    <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-brand bg-brand-soft px-4 py-2 text-xs font-medium text-brand print:hidden">
      <Icons.lock className="size-4 shrink-0" />
      <span className="mr-auto">
        {t.planReadOnly}
        {locksAt && ` ${t.planLocksOn.replace('{date}', localDateOf(locksAt))}`}
      </span>
      <a
        href={telegramLink(t.telegramMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 font-semibold text-white transition-colors hover:bg-brand-dark"
      >
        <Icons.send className="size-3.5" />
        {t.planRenew}
      </a>
    </div>
  );
};
