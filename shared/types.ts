// Types shared by the client and the server

export const ROLES = ['super_admin', 'team_lead', 'member', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = ['todo', 'in_progress', 'ready_for_review', 'approved'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const GROUP_CATEGORIES = ['assignment', 'research', 'startup', 'other'] as const;
export type GroupCategory = (typeof GROUP_CATEGORIES)[number];

export const GROUP_STATUSES = ['active', 'completed', 'archived'] as const;
export type GroupStatus = (typeof GROUP_STATUSES)[number];

export type DailyLogStatus = 'in_progress' | 'completed' | 'approved';

/** Where a paid account stands. After the end date there are some view-only days, then the account is locked. */
export interface PlanInfo {
  status: 'active' | 'read_only';
  expiresAt?: string;
  locksAt?: string;
}

export interface User {
  id: string;
  name: string;
  nameKm?: string;
  email: string;
  avatar?: string;
  role: Role;
  specialty?: string;
  department?: string;
  /** Only set on the signed-in user: someone else chose this password, so it must be changed first. */
  mustChangePassword?: boolean;
  /** Only set on the signed-in user. */
  plan?: PlanInfo;
}

export interface DailyTodoItem {
  id: string;
  text: string;
  done: boolean;
  progressTag?: string; // e.g. '80%'
}

export interface DailyLogReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface DailyLog {
  id: string;
  groupId: string;
  userId: string;
  date: string; // YYYY-MM-DD in the author's local time zone
  timestamp: string; // ISO 8601 creation time
  title: string; // e.g. 'JulNow - Dashboard'
  rawContent: string; // the exact text entered
  items: DailyTodoItem[]; // parsed bullet items
  overallDone: boolean;
  status: DailyLogStatus;
  completedAt?: string;
  leaderChecked: boolean;
  leaderNote?: string;
  approvedBy?: string;
  reactions: DailyLogReaction[];
  commentCount?: number;
}

export type CommentKind = 'task' | 'daily_log';

/** A comment under a task or a daily update. The author's name is included so removed members still show. */
export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userNameKm?: string;
  avatar?: string;
  body: string;
  createdAt: string;
}

export interface Task {
  id: string;
  groupId: string;
  title: string;
  module: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  priority: TaskPriority;
  status: TaskStatus;
  /** First day of work, YYYY-MM-DD. Never after dueDate. */
  startDate: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  createdAt: string;
  completedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  memberNotes?: string;
  leaderFeedback?: string;
  commentCount?: number;
}

export interface Group {
  id: string;
  name: string;
  nameKm?: string;
  code: string;
  description: string;
  courseOrProject: string;
  leaderId: string;
  memberIds: string[];
  createdAt: string;
  deadline?: string; // YYYY-MM-DD
  status: GroupStatus;
  category: GroupCategory;
  /** The leader's plan has ended, so the group is view-only for everyone except the Super Admin. */
  planEnded?: boolean;
  /** While in the future, the Super Admin can open this group to help. Only the leader sets it. */
  supportAccessUntil?: string;
}

export type ActivityEventType =
  | 'task_completed'
  | 'task_approved'
  | 'task_assigned'
  | 'task_deadline_changed'
  | 'member_added'
  | 'member_removed'
  | 'member_role_changed'
  | 'daily_todo_posted'
  | 'daily_todo_completed'
  | 'daily_todo_approved'
  | 'group_created'
  | 'group_deadline_changed'
  | 'support_access_changed';

export interface ActivityEvent {
  id: string;
  groupId: string;
  type: ActivityEventType;
  actorId: string;
  actorName: string;
  targetId?: string;
  targetTitle: string;
  description: string;
  descriptionKm?: string;
  timestamp: string; // ISO 8601
  date: string; // YYYY-MM-DD (UTC)
  metadata?: {
    oldValue?: string;
    newValue?: string;
    role?: string;
    feedback?: string;
  };
}

export const NOTIFICATION_TYPES = [
  'task_assigned',
  'task_ready_for_review',
  'task_approved',
  'task_due_soon',
  'task_overdue',
  'daily_approved',
  'daily_reaction',
  'plan_expiring',
  'comment_added',
  'password_reset',
  'task_rescheduled',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** One entry in the bell. `params` holds the words to fill in (title, date, emoji, feedback). */
export interface AppNotification {
  id: string;
  type: NotificationType;
  groupId?: string;
  targetId?: string;
  actorName?: string;
  params: Record<string, string>;
  createdAt: string;
  read: boolean;
}

/** Response of GET /api/notifications. */
export interface NotificationsResponse {
  items: AppNotification[];
  unread: number;
}

export interface AdminUserRow {
  id: string;
  name: string;
  nameKm?: string;
  email: string;
  username?: string;
  role: Role;
  avatar?: string;
  createdAt: string;
  /** Last time the person used the app (checked every few minutes while it is open) */
  lastSeenAt?: string;
  /** false = added by an admin but has not created the password yet */
  registered: boolean;
  /** false = deleted (kept in the database, can be restored) */
  isActive: boolean;
  /** Last moment the account works (ISO). Missing = never expires. */
  expiresAt?: string;
  /** Most people allowed in each of this leader's groups. Missing = unlimited. */
  maxMembers?: number;
  groupCount: number;
}

export interface AdminGroupRow {
  id: string;
  name: string;
  nameKm?: string;
  code: string;
  status: GroupStatus;
  category: GroupCategory;
  createdAt: string;
  leaderName?: string;
  memberCount: number;
  taskCount: number;
  isActive: boolean;
  /** While in the future, the leader has allowed the Super Admin to open this group. */
  supportAccessUntil?: string;
}

/** Response of GET /api/admin/overview (Super Admin only). */
export interface AdminOverview {
  users: AdminUserRow[];
  groups: AdminGroupRow[];
}

/** Response of GET /api/bootstrap. */
export interface BootstrapData {
  currentUser: User;
  users: User[];
  groups: Group[];
  tasks: Task[];
  dailyLogs: DailyLog[];
  activityEvents: ActivityEvent[];
}
