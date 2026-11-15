import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ActivityEvent, BootstrapData, DailyLog, Group, Role, Task, TaskStatus, User } from '../types';
import { translations, Language } from '../locales/translations';
import { api, ApiError } from '../lib/api';
import { todayLocal } from '../lib/dates';
import { buildDemoData } from '../lib/demoData';

type SessionStatus = 'loading' | 'signed_out' | 'ready';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['km'];

  status: SessionStatus;
  currentUser: User;
  login: (email: string, password: string) => Promise<void>;
  enterDemo: () => void;
  isDemo: boolean;
  isReadOnly: boolean;
  groupFrozen: boolean;
  groupArchived: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;

  notice: { type: 'error' | 'success'; message: string } | null;
  dismissNotice: () => void;
  showError: (message: string) => void;

  isSuperAdmin: boolean;
  canCreateGroup: boolean;
  /** Super Admin or the group leader. */
  canManageGroup: boolean;
  /** Can assign and approve tasks. */
  isTeamLead: boolean;
  /** Can post and work on tasks (not a viewer). */
  canContribute: boolean;

  users: User[];
  groups: Group[];
  activeGroupId: string;
  setActiveGroupId: (id: string) => void;
  activeGroup: Group | undefined;
  activeGroupMembers: User[];
  tasks: Task[];
  activeGroupTasks: Task[];
  dailyLogs: DailyLog[];
  activeGroupDailyLogs: DailyLog[];
  activityEvents: ActivityEvent[];
  activeGroupActivityEvents: ActivityEvent[];

  addMemberToGroup: (data: {
    name: string;
    nameKm?: string;
    email: string;
    role: Role;
    specialty?: string;
    department?: string;
    password?: string;
    groupId?: string;
  }) => Promise<{ password?: string } | undefined>;
  removeMemberFromGroup: (userId: string, groupId?: string) => Promise<void>;
  updateAvatar: (avatar: string) => Promise<void>;
  updateProfile: (data: { name: string; nameKm?: string; specialty?: string }) => Promise<void>;
  updateUserRole: (userId: string, newRole: Role) => Promise<void>;
  createGroup: (data: {
    name: string;
    nameKm?: string;
    code: string;
    courseOrProject: string;
    description: string;
    deadline?: string;
    category: Group['category'];
  }) => Promise<void>;
  joinGroup: (code: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  leaveGroup: (userId: string, groupId?: string) => Promise<void>;
  updateGroupDeadline: (groupId: string, newDeadline: string) => Promise<void>;
  updateGroupStatus: (groupId: string, status: Group['status']) => Promise<void>;

  addSimpleDailyLog: (rawContent: string) => Promise<void>;
  toggleDailyTodoItem: (logId: string, itemId: string) => Promise<void>;
  markDailyLogDone: (logId: string) => Promise<void>;
  approveDailyLog: (logId: string, feedback?: string) => Promise<void>;
  deleteDailyLog: (logId: string) => Promise<void>;
  addReactionToDailyLog: (logId: string, emoji: string) => Promise<void>;

  assignTask: (data: {
    title: string;
    module: string;
    description: string;
    assignedTo: string;
    priority: Task['priority'];
    startDate?: string;
    dueDate: string;
    dueTime?: string;
  }) => Promise<void>;
  updateTaskStatus: (taskId: string, status: Exclude<TaskStatus, 'approved'>, memberNotes?: string) => Promise<void>;
  updateTaskDeadline: (taskId: string, newDueDate: string, newDueTime?: string) => Promise<void>;
  rescheduleTask: (taskId: string, startDate: string, dueDate: string) => Promise<void>;
  reassignTask: (taskId: string, assignedTo: string) => Promise<void>;
  approveTask: (taskId: string, leaderFeedback?: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  clearActivityLogs: (groupId?: string) => Promise<void>;
}

// localStorage keeps UI preferences only
const STORAGE_KEYS = {
  ACTIVE_GROUP: 'leadersync_active_group',
  LANGUAGE: 'leadersync_language',
};

const POLL_INTERVAL_MS = 30_000;

const readStorage = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* no storage */
  }
};

const EMPTY_USER: User = { id: '', name: '', email: '', role: 'viewer' };

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() =>
    readStorage(STORAGE_KEYS.LANGUAGE) === 'en' ? 'en' : 'km'
  );
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [isDemo, setIsDemo] = useState(false);
  const demoRef = useRef(false);
  const [data, setData] = useState<BootstrapData | null>(null);
  const [activeGroupId, setActiveGroupIdState] = useState<string>(() => readStorage(STORAGE_KEYS.ACTIVE_GROUP) || '');
  const [notice, setNotice] = useState<AppContextType['notice']>(null);
  const noticeTimer = useRef<number | undefined>(undefined);

  const t = translations[language];

  const showNotice = useCallback((type: 'error' | 'success', message: string) => {
    setNotice({ type, message });
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 5000);
  }, []);

  const refresh = useCallback(async () => {
    if (demoRef.current) return;
    try {
      const next = await api.bootstrap();
      setData(next);
      setStatus('ready');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setData(null);
        setStatus('signed_out');
      } else {
        throw err;
      }
    }
  }, []);

  useEffect(() => {
    refresh().catch(err => {
      setStatus('signed_out');
      showNotice('error', err.message);
    });
  }, [refresh, showNotice]);

  useEffect(() => {
    if (status !== 'ready' || isDemo) return;
    const tick = () => {
      if (document.visibilityState === 'visible') refresh().catch(() => undefined);
    };
    const id = window.setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [status, isDemo, refresh]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.LANGUAGE, language);
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => {
    if (activeGroupId && !isDemo) writeStorage(STORAGE_KEYS.ACTIVE_GROUP, activeGroupId);
  }, [activeGroupId, isDemo]);

  const currentUser = data?.currentUser ?? EMPTY_USER;
  const users = data?.users ?? [];
  const groups = data?.groups ?? [];
  const tasks = data?.tasks ?? [];
  const dailyLogs = data?.dailyLogs ?? [];
  const activityEvents = data?.activityEvents ?? [];

  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];
  const resolvedGroupId = activeGroup?.id ?? '';

  const derived = useMemo(() => {
    const memberIds = new Set(activeGroup?.memberIds ?? []);
    return {
      activeGroupMembers: users.filter(u => memberIds.has(u.id)),
      activeGroupTasks: tasks.filter(t => t.groupId === resolvedGroupId),
      activeGroupDailyLogs: dailyLogs.filter(d => d.groupId === resolvedGroupId),
      activeGroupActivityEvents: activityEvents.filter(e => e.groupId === resolvedGroupId),
    };
  }, [activeGroup, users, tasks, dailyLogs, activityEvents, resolvedGroupId]);

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isReadOnly = currentUser.plan?.status === 'read_only';
  const groupFrozen = !!activeGroup?.planEnded && !isSuperAdmin;
  const groupArchived = activeGroup?.status === 'archived';
  const noEdits = isReadOnly || groupFrozen;
  // An archived group can still be managed (to open it again), but its work cannot change
  const noWork = noEdits || groupArchived;
  const canCreateGroup = !isReadOnly && (isSuperAdmin || currentUser.role === 'team_lead');
  const canManageGroup = !noEdits && (isSuperAdmin || (!!activeGroup && activeGroup.leaderId === currentUser.id));
  const isMemberOfActive = !!activeGroup?.memberIds.includes(currentUser.id);
  const isTeamLead =
    !noWork &&
    (isSuperAdmin || (isMemberOfActive && (currentUser.role === 'team_lead' || activeGroup?.leaderId === currentUser.id)));
  const canContribute = !noWork && (isSuperAdmin || (isMemberOfActive && currentUser.role !== 'viewer'));

  const run = useCallback(
    async (action: () => Promise<unknown>, successMessage?: string) => {
      // The demo changes nothing
      if (demoRef.current) {
        showNotice('error', t.demoReadOnly);
        return;
      }
      try {
        await action();
        if (successMessage) showNotice('success', successMessage);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setData(null);
          setStatus('signed_out');
        }
        showNotice('error', err instanceof Error ? err.message : String(err));
        throw err;
      } finally {
        await refresh().catch(() => undefined);
      }
    },
    [refresh, showNotice, t]
  );
  const quiet = (p: Promise<unknown>) => p.then(() => undefined, () => undefined);

  const value: AppContextType = {
    language,
    setLanguage: setLanguageState,
    t,

    status,
    currentUser,
    async login(email, password) {
      await api.login(email, password);
      await refresh();
    },
    enterDemo() {
      demoRef.current = true;
      setIsDemo(true);
      const demo = buildDemoData();
      setData(demo);
      setActiveGroupIdState(demo.groups[0].id);
      setStatus('ready');
    },
    isDemo,
    isReadOnly,
    groupFrozen,
    groupArchived,
    async logout() {
      if (demoRef.current) {
        demoRef.current = false;
        setIsDemo(false);
      } else {
        await api.logout().catch(() => undefined);
      }
      setData(null);
      setStatus('signed_out');
    },
    refresh,

    notice,
    dismissNotice: () => setNotice(null),
    showError: message => showNotice('error', message),

    isSuperAdmin,
    canCreateGroup,
    canManageGroup,
    isTeamLead,
    canContribute,

    users,
    groups,
    activeGroupId: resolvedGroupId,
    setActiveGroupId: setActiveGroupIdState,
    activeGroup,
    ...derived,
    tasks,
    dailyLogs,
    activityEvents,

    addMemberToGroup: async ({ groupId, ...member }) => {
      let created: { password?: string } | undefined;
      await run(async () => {
        created = await api.addMember(groupId || resolvedGroupId, member);
      });
      return created;
    },
    removeMemberFromGroup: (userId, groupId) =>
      quiet(run(() => api.removeMember(groupId || resolvedGroupId, userId))),
    updateAvatar: avatar => run(() => api.updateAvatar(avatar)),
    updateProfile: data => run(() => api.updateProfile(data)),
    updateUserRole: (userId, role) => quiet(run(() => api.updateUserRole(userId, role, resolvedGroupId || undefined))),
    createGroup: input =>
      run(async () => {
        const { id } = await api.createGroup(input);
        setActiveGroupIdState(id);
      }),
    joinGroup: code =>
      run(async () => {
        const { id } = await api.joinGroup(code);
        setActiveGroupIdState(id);
      }),
    deleteGroup: groupId => run(() => api.deleteGroup(groupId)),
    leaveGroup: (userId, groupId) => run(() => api.removeMember(groupId || resolvedGroupId, userId)),
    updateGroupDeadline: (groupId, deadline) => quiet(run(() => api.updateGroup(groupId, { deadline }))),
    updateGroupStatus: (groupId, status) => quiet(run(() => api.updateGroup(groupId, { status }))),

    addSimpleDailyLog: rawContent => run(() => api.createDailyLog(resolvedGroupId, rawContent, todayLocal())),
    toggleDailyTodoItem: (logId, itemId) => quiet(run(() => api.toggleDailyLogItem(logId, itemId))),
    markDailyLogDone: logId => quiet(run(() => api.completeDailyLog(logId))),
    approveDailyLog: (logId, feedback) => quiet(run(() => api.approveDailyLog(logId, feedback))),
    deleteDailyLog: logId => quiet(run(() => api.deleteDailyLog(logId))),
    addReactionToDailyLog: (logId, emoji) => quiet(run(() => api.toggleReaction(logId, emoji))),

    assignTask: input => run(() => api.createTask(resolvedGroupId, input)),
    updateTaskStatus: (taskId, status, notes) => quiet(run(() => api.updateTaskStatus(taskId, status, notes))),
    reassignTask: (taskId, assignedTo) => quiet(run(() => api.reassignTask(taskId, assignedTo))),
    rescheduleTask: (taskId, startDate, dueDate) => quiet(run(() => api.scheduleTask(taskId, startDate, dueDate))),
    updateTaskDeadline: (taskId, dueDate, dueTime) => quiet(run(() => api.updateTaskDeadline(taskId, dueDate, dueTime))),
    approveTask: (taskId, feedback) => quiet(run(() => api.approveTask(taskId, feedback))),
    deleteTask: taskId => quiet(run(() => api.deleteTask(taskId))),

    clearActivityLogs: groupId => quiet(run(() => api.clearActivity(groupId || resolvedGroupId))),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
