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

/** Active, then view only after the end date, then locked. */
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
  mustChangePassword?: boolean;
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
  editedAt?: string;
  leaderChecked: boolean;
  leaderNote?: string;
  approvedBy?: string;
  reactions: DailyLogReaction[];
  commentCount?: number;
}

export type CommentKind = 'task' | 'daily_log';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userNameKm?: string;
  userRole: Role;
  avatar?: string;
  body: string;
  createdAt: string;
  editedAt?: string;
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
  startDate: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  createdAt: string;
  completedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  /** 0 to 100 */
  progress: number;
  /** Same for the tasks given to several people */
  batchId?: string;
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
  /** Specialty of each member in this group */
  memberSpecialties?: Record<string, string>;
  createdAt: string;
  deadline?: string; // YYYY-MM-DD
  status: GroupStatus;
  category: GroupCategory;
  /** The leader's plan has ended: view only. */
  planEnded?: boolean;
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
  | 'group_status_changed'
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
  lastSeenAt?: string;
  registered: boolean;
  isActive: boolean;
  expiresAt?: string;
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
  supportAccessUntil?: string;
}

export interface AdminOverview {
  users: AdminUserRow[];
  groups: AdminGroupRow[];
}

export interface BootstrapData {
  currentUser: User;
  users: User[];
  groups: Group[];
  tasks: Task[];
  dailyLogs: DailyLog[];
  activityEvents: ActivityEvent[];
}
