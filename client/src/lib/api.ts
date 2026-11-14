import type { AdminOverview, BootstrapData, Role, TaskPriority, TaskStatus, User, GroupCategory } from '@shared/types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Same origin by default. Set VITE_API_URL only if the API is hosted elsewhere.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

async function request<T = void>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || `Request failed (${res.status})`);
  return data as T;
}

const get = <T>(path: string) => request<T>('GET', path);
const post = <T = void>(path: string, body: unknown = {}) => request<T>('POST', path, body);
const patch = (path: string, body: unknown) => request('PATCH', path, body);
const del = (path: string) => request('DELETE', path);

export const api = {
  me: () => get<{ user: User }>('/auth/me'),
  login: (email: string, password: string) => post<{ user: User }>('/auth/login', { email, password }),
  logout: () => post('/auth/logout'),
  changePassword: (currentPassword: string, newPassword: string) =>
    post('/auth/change-password', { currentPassword, newPassword }),

  bootstrap: () => get<BootstrapData>('/bootstrap'),

  createGroup: (data: {
    name: string;
    nameKm?: string;
    code?: string;
    courseOrProject: string;
    description?: string;
    deadline?: string;
    category: GroupCategory;
  }) => post<{ id: string }>('/groups', data),
  joinGroup: (code: string) => post<{ id: string }>('/groups/join', { code }),
  updateGroup: (groupId: string, data: { deadline?: string | null }) => patch(`/groups/${groupId}`, data),
  deleteGroup: (groupId: string) => del(`/groups/${groupId}`),
  addMember: (
    groupId: string,
    data: { name: string; nameKm?: string; email: string; role: Role; specialty?: string; department?: string; password?: string }
  ) => post<{ id: string }>(`/groups/${groupId}/members`, data),
  memberCandidates: (groupId: string, q: string) =>
    get<Pick<User, 'id' | 'name' | 'nameKm' | 'email' | 'avatar' | 'role'>[]>(
      `/groups/${groupId}/member-candidates?q=${encodeURIComponent(q)}`
    ),
  removeMember: (groupId: string, userId: string) => del(`/groups/${groupId}/members/${userId}`),
  clearActivity: (groupId: string) => del(`/groups/${groupId}/activity`),
  adminOverview: () => get<AdminOverview>('/admin/overview'),
  setUserActive: (userId: string, active: boolean) => post(`/admin/users/${userId}/active`, { active }),
  createLeader: (data: {
    name: string;
    nameKm?: string;
    email: string;
    username?: string;
    password: string;
    expiresAt?: string | null;
    maxMembers?: number | null;
  }) => post<{ id: string }>('/admin/users', data),
  setUserPlan: (userId: string, data: { expiresAt?: string | null; maxMembers?: number | null }) =>
    post(`/admin/users/${userId}/plan`, data),
  setGroupActive: (groupId: string, active: boolean) => post(`/admin/groups/${groupId}/active`, { active }),
  updateProfile: (data: { name: string; nameKm?: string; specialty?: string }) => patch('/users/me', data),
  updateAvatar: (avatar: string) => patch('/users/me/avatar', { avatar }),
  updateUserRole: (userId: string, role: Role, groupId?: string) => patch(`/users/${userId}/role`, { role, groupId }),

  createTask: (
    groupId: string,
    data: { title: string; module: string; description: string; assignedTo: string; priority: TaskPriority; dueDate: string; dueTime?: string }
  ) => post<{ id: string }>(`/groups/${groupId}/tasks`, data),
  updateTaskStatus: (taskId: string, status: Exclude<TaskStatus, 'approved'>, memberNotes?: string) =>
    patch(`/tasks/${taskId}/status`, { status, memberNotes }),
  updateTaskDeadline: (taskId: string, dueDate: string, dueTime?: string) =>
    patch(`/tasks/${taskId}/deadline`, { dueDate, dueTime }),
  approveTask: (taskId: string, feedback?: string) => post(`/tasks/${taskId}/approve`, { feedback }),
  deleteTask: (taskId: string) => del(`/tasks/${taskId}`),

  createDailyLog: (groupId: string, rawContent: string, date: string) =>
    post<{ id: string }>(`/groups/${groupId}/daily-logs`, { rawContent, date }),
  toggleDailyLogItem: (logId: string, itemId: string) => post(`/daily-logs/${logId}/items/${itemId}/toggle`),
  completeDailyLog: (logId: string) => post(`/daily-logs/${logId}/complete`),
  approveDailyLog: (logId: string, feedback?: string) => post(`/daily-logs/${logId}/approve`, { feedback }),
  deleteDailyLog: (logId: string) => del(`/daily-logs/${logId}`),
  toggleReaction: (logId: string, emoji: string) => post(`/daily-logs/${logId}/reactions`, { emoji }),
};
