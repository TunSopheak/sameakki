import type { LandingSettings } from '@shared/landing';
import { localizeError } from '../locales/serverErrors';
import type { AdminOverview, BootstrapData, Comment, CommentKind, NotificationsResponse, Role, TaskPriority, TaskStatus, User, GroupCategory, GroupStatus } from '@shared/types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Same origin unless VITE_API_URL is set
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
    throw new ApiError(0, localizeError('Cannot reach the server. Check your connection and try again.'));
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, localizeError(data.error || `Request failed (${res.status})`));
  return data as T;
}

const get = <T>(path: string) => request<T>('GET', path);
const post = <T = void>(path: string, body: unknown = {}) => request<T>('POST', path, body);
const patch = <T = void>(path: string, body: unknown) => request<T>('PATCH', path, body);
const put = <T = void>(path: string, body: unknown) => request<T>('PUT', path, body);
const del = (path: string) => request('DELETE', path);

const commentPath = (kind: CommentKind, id: string) => (kind === 'task' ? `/tasks/${id}` : `/daily-logs/${id}`);

export const api = {
  me: () => get<{ user: User }>('/auth/me'),
  login: (email: string, password: string) => post<{ user: User }>('/auth/login', { email, password }),
  logout: () => post('/auth/logout'),
  resetPassword: (userId: string) => post<{ password: string }>(`/users/${userId}/reset-password`),
  changePassword: (currentPassword: string, newPassword: string) =>
    post('/auth/change-password', { currentPassword, newPassword }),

  bootstrap: () => get<BootstrapData>('/bootstrap'),

  landingSettings: () => get<LandingSettings>('/public/landing'),
  saveLandingSettings: (data: LandingSettings) => put<LandingSettings>('/admin/landing', data),

  comments: (kind: CommentKind, id: string) => get<Comment[]>(`${commentPath(kind, id)}/comments`),
  addComment: (kind: CommentKind, id: string, body: string) => post<Comment>(`${commentPath(kind, id)}/comments`, { body }),
  editComment: (commentId: string, body: string) => patch<Comment>(`/comments/${commentId}`, { body }),
  deleteComment: (commentId: string) => del(`/comments/${commentId}`),

  notifications: () => get<NotificationsResponse>('/notifications'),
  markNotificationRead: (id: string) => post(`/notifications/${id}/read`),
  markAllNotificationsRead: () => post('/notifications/read-all'),

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
  updateGroup: (groupId: string, data: { deadline?: string | null; status?: GroupStatus }) => patch(`/groups/${groupId}`, data),
  deleteGroup: (groupId: string) => del(`/groups/${groupId}`),
  addMember: (
    groupId: string,
    data: { name: string; nameKm?: string; email: string; role: Role; specialty?: string; department?: string; password?: string }
  ) => post<{ id: string; password?: string }>(`/groups/${groupId}/members`, data),
  memberCandidates: (groupId: string, q: string) =>
    get<Pick<User, 'id' | 'name' | 'nameKm' | 'email' | 'avatar' | 'role'>[]>(
      `/groups/${groupId}/member-candidates?q=${encodeURIComponent(q)}`
    ),
  removeMember: (groupId: string, userId: string) => del(`/groups/${groupId}/members/${userId}`),
  setSupportAccess: (groupId: string, hours: number) => post(`/groups/${groupId}/support-access`, { hours }),
  clearActivity: (groupId: string) => del(`/groups/${groupId}/activity`),
  adminOverview: () => get<AdminOverview>('/admin/overview'),
  setUserActive: (userId: string, active: boolean) => post(`/admin/users/${userId}/active`, { active }),
  createLeader: (data: {
    name: string;
    nameKm?: string;
    email: string;
    username?: string;
    password?: string;
    expiresAt?: string | null;
    maxMembers?: number | null;
  }) => post<{ id: string; password?: string }>('/admin/users', data),
  setUserPlan: (userId: string, data: { expiresAt?: string | null; maxMembers?: number | null }) =>
    post(`/admin/users/${userId}/plan`, data),
  setGroupActive: (groupId: string, active: boolean) => post(`/admin/groups/${groupId}/active`, { active }),
  updateMemberSpecialty: (groupId: string, userId: string, specialty: string) =>
    patch(`/groups/${groupId}/members/${userId}/specialty`, { specialty }),
  updateProfile: (data: { name: string; nameKm?: string; specialty?: string }) => patch('/users/me', data),
  updateAvatar: (avatar: string) => patch('/users/me/avatar', { avatar }),
  updateUserRole: (userId: string, role: Role, groupId?: string) => patch(`/users/${userId}/role`, { role, groupId }),

  createTask: (
    groupId: string,
    data: { title: string; module: string; description: string; assignedTo?: string; assigneeIds?: string[]; assignToAll?: boolean; priority: TaskPriority; startDate?: string; dueDate: string; dueTime?: string }
  ) => post<{ id: string; ids: string[] }>(`/groups/${groupId}/tasks`, data),
  updateTaskStatus: (taskId: string, status: Exclude<TaskStatus, 'approved'>, memberNotes?: string) =>
    patch(`/tasks/${taskId}/status`, { status, memberNotes }),
  updateTaskProgress: (taskId: string, progress: number, memberNotes?: string) =>
    patch(`/tasks/${taskId}/progress`, { progress, memberNotes }),
  reassignTask: (taskId: string, assignedTo: string) => patch(`/tasks/${taskId}/assignee`, { assignedTo }),
  scheduleTask: (taskId: string, startDate: string, dueDate: string) => patch(`/tasks/${taskId}/schedule`, { startDate, dueDate }),
  updateTaskDeadline: (taskId: string, dueDate: string, dueTime?: string) =>
    patch(`/tasks/${taskId}/deadline`, { dueDate, dueTime }),
  approveTask: (taskId: string, feedback?: string) => post(`/tasks/${taskId}/approve`, { feedback }),
  reopenTask: (taskId: string) => post(`/tasks/${taskId}/reopen`),
  deleteTask: (taskId: string) => del(`/tasks/${taskId}`),
  deleteTeamTask: (groupId: string, batchId: string) => del(`/groups/${groupId}/task-batches/${batchId}`),

  editDailyLog: (logId: string, rawContent: string) => patch(`/daily-logs/${logId}`, { rawContent }),
  createDailyLog: (groupId: string, rawContent: string, date: string) =>
    post<{ id: string }>(`/groups/${groupId}/daily-logs`, { rawContent, date }),
  toggleDailyLogItem: (logId: string, itemId: string) => post(`/daily-logs/${logId}/items/${itemId}/toggle`),
  completeDailyLog: (logId: string) => post(`/daily-logs/${logId}/complete`),
  approveDailyLog: (logId: string, feedback?: string) => post(`/daily-logs/${logId}/approve`, { feedback }),
  reopenDailyLog: (logId: string) => post(`/daily-logs/${logId}/reopen`),
  deleteDailyLog: (logId: string) => del(`/daily-logs/${logId}`),
  toggleReaction: (logId: string, emoji: string) => post(`/daily-logs/${logId}/reactions`, { emoji }),
};
