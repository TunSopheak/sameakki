import type { ActivityEvent, AppNotification, BootstrapData, DailyLog, Task, User } from '@shared/types';

// Sample data for the demo, kept in the browser only

const DAY = 24 * 60 * 60 * 1000;
const dateOffset = (days: number) => {
  const d = new Date(Date.now() + days * DAY);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const isoOffset = (days: number, hours = 0) => new Date(Date.now() + days * DAY + hours * 3_600_000).toISOString();

export const DEMO_GROUP_ID = 'demo-group';

export function buildDemoData(): BootstrapData {
  const lead: User = { id: 'demo-lead', name: 'Demo Leader', nameKm: 'ប្រធានក្រុម (គំរូ)', email: 'leader@demo.local', role: 'team_lead', department: 'Team Leader', avatar: 'm1' };
  const users: User[] = [
    lead,
    { id: 'demo-1', name: 'Sokha', nameKm: 'សុខា', email: 'sokha@demo.local', role: 'member', specialty: 'Frontend', department: 'Member', avatar: 'f1' },
    { id: 'demo-2', name: 'Dara', nameKm: 'ដារ៉ា', email: 'dara@demo.local', role: 'member', specialty: 'Backend', department: 'Member', avatar: 'm2' },
    { id: 'demo-3', name: 'Sreyneang', nameKm: 'ស្រីនាង', email: 'sreyneang@demo.local', role: 'member', specialty: 'Design', department: 'Member', avatar: 'f2' },
    { id: 'demo-4', name: 'Vibol', nameKm: 'វិបុល', email: 'vibol@demo.local', role: 'viewer', department: 'Member', avatar: 'm3' },
  ];

  const task = (id: string, title: string, assignedTo: string, status: Task['status'], priority: Task['priority'], startIn: number, dueIn: number, module: string): Task => ({
    id,
    groupId: DEMO_GROUP_ID,
    title,
    module,
    description: 'Sample task for the demo.',
    assignedTo,
    assignedBy: lead.id,
    progress: status === 'todo' ? 0 : status === 'in_progress' ? 50 : 100,
    priority,
    status,
    startDate: dateOffset(startIn),
    dueDate: dateOffset(dueIn),
    createdAt: isoOffset(-5),
    completedAt: status === 'ready_for_review' || status === 'approved' ? isoOffset(-1) : undefined,
    approvedAt: status === 'approved' ? isoOffset(-1) : undefined,
    approvedBy: status === 'approved' ? lead.id : undefined,
    leaderFeedback: status === 'approved' ? 'Great work!' : undefined,
  });
  const tasks: Task[] = [
    task('demo-t1', 'Design the login screen', 'demo-3', 'approved', 'medium', -6, -2, 'Design'),
    task('demo-t2', 'Build the dashboard page', 'demo-1', 'in_progress', 'high', -1, 3, 'Frontend'),
    task('demo-t3', 'Create the tasks API', 'demo-2', 'ready_for_review', 'high', -3, 1, 'Backend'),
    task('demo-t4', 'Write the user guide', 'demo-3', 'todo', 'low', 2, 7, 'Docs'),
    task('demo-t5', 'Fix the mobile menu', 'demo-1', 'todo', 'urgent', 0, 2, 'Frontend'),
  ];

  const log = (id: string, userId: string, title: string, items: [string, boolean][], status: DailyLog['status']): DailyLog => ({
    id,
    groupId: DEMO_GROUP_ID,
    userId,
    date: dateOffset(0),
    timestamp: isoOffset(0, -2),
    title,
    rawContent: items.map(([text]) => `- ${text}`).join('\n'),
    items: items.map(([text, done], i) => ({ id: `${id}-${i}`, text, done })),
    overallDone: items.every(([, done]) => done),
    status,
    leaderChecked: status === 'approved',
    reactions: [],
  });
  const dailyLogs: DailyLog[] = [
    log('demo-l1', 'demo-1', 'Dashboard', [['Layout cards', true], ['Connect charts', false]], 'in_progress'),
    log('demo-l2', 'demo-2', 'API', [['Tasks endpoint', true], ['Validation', true]], 'completed'),
  ];

  const event = (id: string, type: ActivityEvent['type'], actor: User, description: string, hoursAgo: number): ActivityEvent => ({
    id,
    groupId: DEMO_GROUP_ID,
    type,
    actorId: actor.id,
    actorName: actor.name,
    targetTitle: '',
    description,
    timestamp: isoOffset(0, -hoursAgo),
    date: isoOffset(0, -hoursAgo).slice(0, 10),
  });
  const activityEvents: ActivityEvent[] = [
    event('demo-e1', 'task_assigned', lead, 'assigned "Fix the mobile menu"', 3),
    event('demo-e2', 'task_completed', users[2], 'finished "Create the tasks API"', 5),
    event('demo-e3', 'member_added', lead, 'added Sreyneang as member', 26),
  ];

  return {
    currentUser: lead,
    users,
    groups: [
      {
        id: DEMO_GROUP_ID,
        name: 'Demo Project Team',
        nameKm: 'ក្រុមគម្រោងគំរូ',
        code: 'GRP-DEMO',
        description: 'A sample team to explore Sameakki.',
        courseOrProject: 'Website Project',
        leaderId: lead.id,
        memberIds: users.map(u => u.id),
        createdAt: isoOffset(-14),
        deadline: dateOffset(21),
        status: 'active',
        category: 'startup',
      },
    ],
    tasks,
    dailyLogs,
    activityEvents,
  };
}

export function buildDemoNotifications(): AppNotification[] {
  const make = (id: string, type: AppNotification['type'], hoursAgo: number, read: boolean, actorName: string | undefined, params: Record<string, string>): AppNotification => ({
    id,
    type,
    groupId: DEMO_GROUP_ID,
    actorName,
    params,
    createdAt: isoOffset(0, -hoursAgo),
    read,
  });
  return [
    make('demo-n1', 'task_ready_for_review', 1, false, 'Dara', { title: 'Create the tasks API' }),
    make('demo-n2', 'task_overdue', 3, false, undefined, { title: 'Fix the mobile menu', dueDate: dateOffset(-1) }),
    make('demo-n3', 'daily_reaction', 6, false, 'Sokha', { title: 'Dashboard', emoji: '\u{1F44F}' }),
    make('demo-n4', 'task_due_soon', 20, false, undefined, { title: 'Build the dashboard page', dueDate: dateOffset(1) }),
  ];
}
