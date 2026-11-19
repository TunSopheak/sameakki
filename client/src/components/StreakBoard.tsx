import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useStreaks } from '../lib/useStreaks';
import { useTelegram } from '../lib/useTelegram';
import { Avatar } from './Avatar';
import { Icons } from './icons';

/** "🔥 5" — the flame and the number of days */
export const StreakFlame: React.FC<{ days: number; className?: string }> = ({ days, className = '' }) => (
  <span className={`inline-flex items-center gap-1 font-bold font-mono-numbers ${days > 0 ? 'text-brand-ink' : 'text-neutral-400'} ${className}`}>
    <Icons.streak className="size-4" />
    {days}
  </span>
);

const RANK_STYLE = ['bg-brand text-white', 'bg-neutral-300 text-black', 'bg-neutral-200 text-black'];
const SHOWN = 5;
const DISMISS_KEY = 'sameakki_telegram_nudge_dismissed';

const nudgeDismissed = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

/** Who keeps posting every day. Someone who missed today can be poked, once a day. */
export const StreakBoard: React.FC = () => {
  const { t, currentUser, activeGroupMembers } = useApp();
  const { data, poke } = useStreaks();
  const [all, setAll] = useState(false);
  const telegram = useTelegram();
  const [dismissed, setDismissed] = useState(nudgeDismissed);
  const showNudge = telegram.status?.available && !telegram.status.linked && !dismissed;

  if (!data || data.members.length === 0) return null;

  const members = all ? data.members : data.members.slice(0, SHOWN);
  const hidden = data.members.length - members.length;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
      <div className="mb-3">
        <h3 className="flex items-center gap-1.5 text-base font-bold tracking-tight text-black">
          <Icons.streak className="size-4 text-brand-ink" />
          <span>{t.streakTitle}</span>
        </h3>
        <p className="text-xs text-neutral-500">{t.streakHint}</p>
      </div>

      {showNudge && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-brand/30 bg-brand-soft px-3 py-2.5">
          <Icons.send className="size-4 shrink-0 text-brand-ink" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-black">{t.telegramNudge}</p>
            <p className="text-[11px] leading-snug text-neutral-600">{telegram.waiting ? t.telegramWaiting : t.telegramNudgeHint}</p>
            {telegram.error && <p className="text-[11px] text-brand-ink">{telegram.error}</p>}
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-1">
            <button type="button" onClick={telegram.connect} className="cursor-pointer rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-brand-dark">
              {telegram.waiting ? t.telegramOpenAgain : t.telegramConnect}
            </button>
            <button
              type="button"
              onClick={() => {
                setDismissed(true);
                try {
                  localStorage.setItem(DISMISS_KEY, '1');
                } catch {
                  /* no storage */
                }
              }}
              className="cursor-pointer text-[11px] font-semibold text-neutral-500 hover:text-black"
            >
              {t.telegramLater}
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-1">
        {members.map(member => {
          const rank = data.members.indexOf(member);
          const isMe = member.userId === currentUser.id;
          const poked = data.pokedToday.includes(member.userId);
          const person = activeGroupMembers.find(m => m.id === member.userId);
          return (
            <li key={member.userId} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 ${isMe ? 'bg-brand-soft' : ''}`}>
              <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${RANK_STYLE[rank] ?? 'bg-neutral-100 text-neutral-600'}`}>{rank + 1}</span>
              <Avatar name={member.name} avatar={person?.avatar} className="size-8 shrink-0" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight text-black">
                  {member.name}
                  {isMe && <span className="ml-1 text-xs font-normal text-neutral-500">({t.youLabel})</span>}
                  {member.telegram && (
                    <span title={t.telegramOnTitle} className="ml-1.5 inline-block align-middle text-neutral-400">
                      <Icons.send className="size-3" />
                    </span>
                  )}
                </p>
                <p className={`flex items-center gap-1 text-xs ${member.current > 0 ? 'font-semibold text-brand-ink' : 'text-neutral-400'}`}>
                  {member.current > 0 ? (
                    <>
                      <Icons.streak className="size-3.5" />
                      {t.streakDays.replace('{n}', String(member.current))}
                    </>
                  ) : (
                    t.streakNone
                  )}
                </p>
              </div>

              <div className="shrink-0">
                {member.postedToday ? (
                  <span title={t.streakPostedToday} className="inline-flex size-6 items-center justify-center rounded-full bg-neutral-100 text-brand-ink">
                    <Icons.confirm className="size-3.5" />
                  </span>
                ) : isMe ? (
                  <span className="text-[11px] text-neutral-500">{t.streakPostToday}</span>
                ) : (
                  <button
                    type="button"
                    disabled={poked}
                    onClick={() => poke(member.userId, member.name)}
                    title={poked ? t.pokeAlready : t.pokeHint}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      poked ? 'cursor-default bg-neutral-100 text-neutral-400' : 'cursor-pointer bg-brand text-white hover:bg-brand-dark'
                    }`}
                  >
                    <Icons.poke className="size-3.5" />
                    {poked ? t.pokeDone : t.pokeButton}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {(hidden > 0 || all) && data.members.length > SHOWN && (
        <button type="button" onClick={() => setAll(v => !v)} className="mt-2 w-full cursor-pointer rounded-lg py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-black">
          {all ? t.showLess : `${t.showMore} (${hidden})`}
        </button>
      )}
    </div>
  );
};
