import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { computeStreak, rankMembers, type RankedMember } from '@shared/streak';
import { useApp } from '../context/AppContext';
import { api } from './api';
import { dateInAppZone, todayLocal } from './dates';

export interface StreaksData {
  today: string;
  members: RankedMember[];
  /** People I already poked today */
  pokedToday: string[];
}

/** Streak ranking of the open group, who I poked today, and the poke action. */
export function useStreaks() {
  const { activeGroup, isDemo, activeGroupDailyLogs, activeGroupMembers, showError, showSuccess, t } = useApp();
  const groupId = activeGroup?.id;
  const [data, setData] = useState<StreaksData | null>(null);
  const latest = useRef(0);

  // Changes whenever a ToDo is posted or removed, so the ranking follows
  const version = `${activeGroupDailyLogs.length}:${activeGroupDailyLogs[0]?.timestamp ?? ''}`;

  const reload = useCallback(async (): Promise<StreaksData | null> => {
    if (!groupId || isDemo) return null;
    const ticket = ++latest.current;
    try {
      const next = await api.streaks(groupId);
      // Ignore an answer that is already out of date
      if (ticket === latest.current) setData(next);
      return next;
    } catch {
      return null;
    }
  }, [groupId, isDemo]);

  useEffect(() => {
    setData(null);
  }, [groupId]);

  useEffect(() => {
    void reload();
  }, [reload, version]);

  // The demo has no server, so it works the numbers out here
  const local = useMemo<StreaksData | null>(() => {
    if (!isDemo) return null;
    const today = todayLocal();
    const days = new Map<string, string[]>();
    for (const log of activeGroupDailyLogs) days.set(log.userId, [...(days.get(log.userId) ?? []), dateInAppZone(new Date(log.timestamp))]);
    const members = rankMembers<RankedMember>(
      activeGroupMembers.filter(m => m.role !== 'viewer').map(m => ({ userId: m.id, name: m.name, ...computeStreak(days.get(m.id) ?? [], today) }))
    );
    return { today, members, pokedToday: [] };
  }, [isDemo, activeGroupDailyLogs, activeGroupMembers]);

  const poke = async (userId: string, name: string) => {
    if (!groupId) return;
    if (isDemo) {
      showError(t.demoReadOnly);
      return;
    }
    try {
      const { telegram } = await api.poke(groupId, userId);
      setData(d => (d ? { ...d, pokedToday: [...d.pokedToday, userId] } : d));
      // Say where it arrived, so nobody thinks a poke reached Telegram when it did not
      const message = telegram === 'sent' ? t.pokeSentTelegram : telegram === 'failed' ? t.pokeSentFailed : t.pokeSent;
      showSuccess(message.replace('{name}', name));
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
      void reload();
    }
  };

  return { data: isDemo ? local : data, reload, poke };
}
