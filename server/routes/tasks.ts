import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { getDb, type Queryable } from '../db';
import { TASK_PRIORITIES } from '../../shared/types';
import type { User } from '../../shared/types';
import { assert, assertWritable, getGroupAccess } from '../services/access';
import { logActivity } from '../services/activity';
import { groupLeadIds, notify } from '../services/notifications';
import { badRequest, conflict, notFound } from '../middleware/errors';
import { isoDate, isoTime as time } from '../services/validation';
import { TIME_ZONE } from '../services/time';

export const tasksRouter = Router();


async function loadTask(db: Queryable, user: User, taskId: string) {
  const { rows } = await db.query('SELECT * FROM tasks WHERE id = $1 AND is_active = 1', [taskId]);
  const task = rows[0];
  if (!task) throw notFound('Task not found.');
  const access = await getGroupAccess(db, user, task.group_id);
  return { task, access };
}

/** The person must be in the group, and able to work on a task. */
async function loadAssignee(tx: Queryable, groupId: string, userId: string) {
  const { rows } = await tx.query(
    `SELECT u.name, u.role FROM group_members m JOIN users u ON u.id = m.user_id
      WHERE m.group_id = $1 AND m.user_id = $2`,
    [groupId, userId]
  );
  if (!rows[0]) throw badRequest('The assignee must be a member of this group.');
  // A viewer cannot update a task, so it would be stuck
  if (rows[0].role === 'viewer') throw badRequest('Viewers cannot be assigned tasks.');
  return rows[0] as { name: string; role: string };
}

const START_AFTER_DUE ='The start date cannot be after the due date.';

const createTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    module: z.string().trim().max(120).optional(),
    description: z.string().trim().max(5000).optional(),
    assignedTo: z.string().uuid().optional(),
    assigneeIds: z.array(z.string().uuid()).min(1).max(200).optional(),
    assignToAll: z.boolean().default(false),
    priority: z.enum(TASK_PRIORITIES).default('medium'),
    startDate: isoDate.optional(),
    dueDate: isoDate,
    dueTime: time.optional(),
  })
  .refine(v => v.assignToAll || v.assignedTo || v.assigneeIds, { message: 'Choose who to assign the task to.', path: ['assignedTo'] })
  .refine(v => !v.startDate || v.startDate <= v.dueDate, { message: START_AFTER_DUE, path: ['startDate'] });

async function applySchedule(
  tx: Queryable,
  actor: User,
  task: any,
  next: { startDate: string; dueDate: string; dueTime?: string }
) {
  const dueTime = next.dueTime ?? task.due_time;
  if (next.startDate === task.start_date && next.dueDate === task.due_date && dueTime === task.due_time) return;

  await tx.query('UPDATE tasks SET start_date = $2, due_date = $3, due_time = $4 WHERE id = $1', [
    task.id,
    next.startDate,
    next.dueDate,
    dueTime,
  ]);
  await logActivity(tx, actor, {
    groupId: task.group_id,
    type: 'task_deadline_changed',
    targetId: task.id,
    targetTitle: task.title,
    description: `changed the schedule of "${task.title}" to ${next.startDate} → ${next.dueDate}`,
    descriptionKm: `បានកែកាលវិភាគកិច្ចការ "${task.title}" ទៅ ${next.startDate} → ${next.dueDate}`,
    metadata: { oldValue: task.due_date, newValue: next.dueDate },
  });
  if (task.assigned_to && task.assigned_to !== actor.id) {
    await notify(tx, {
      userId: task.assigned_to,
      type: 'task_rescheduled',
      groupId: task.group_id,
      targetId: task.id,
      actorName: actor.name,
      params: { title: task.title, startDate: next.startDate, dueDate: next.dueDate },
    });
  }
}

/** Creates the tasks of one input (one per person) inside a transaction. Returns their ids. */
async function createTasksIn(tx: Queryable, user: User, groupId: string, input: z.infer<typeof createTaskSchema>): Promise<string[]> {
  let assignees: { id: string; name: string }[];
  if (input.assignToAll) {
    // Viewers cannot do tasks
    const { rows } = await tx.query(
      `SELECT u.id, u.name FROM group_members m JOIN users u ON u.id = m.user_id
        WHERE m.group_id = $1 AND u.role <> 'viewer' ORDER BY u.name`,
      [groupId]
    );
    if (rows.length === 0) throw badRequest('This group has no members to assign.');
    assignees = rows;
  } else {
    const wanted = [...new Set(input.assigneeIds ?? [input.assignedTo!])];
    assignees = [];
    for (const userId of wanted) {
      const assignee = await loadAssignee(tx, groupId, userId);
      assignees.push({ id: userId, name: assignee.name });
    }
  }
  const batchId = assignees.length > 1 ? randomUUID() : null;

  const created: string[] = [];
  for (const person of assignees) {
    const { rows } = await tx.query(
      `INSERT INTO tasks (group_id, title, module, description, assigned_to, assigned_by, priority, due_date, due_time, start_date, batch_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date, $9, LEAST(COALESCE($10::date, (now() AT TIME ZONE $11)::date), $8::date), $12)
       RETURNING id`,
      [
        groupId,
        input.title,
        input.module || 'General',
        input.description || '',
        person.id,
        user.id,
        input.priority,
        input.dueDate,
        input.dueTime || '23:59',
        input.startDate ?? null,
        TIME_ZONE,
        batchId,
      ]
    );
    await logActivity(tx, user, {
      groupId: groupId,
      type: 'task_assigned',
      targetId: rows[0].id,
      targetTitle: input.title,
      description: `assigned task "${input.title}" to ${person.name} (Due: ${input.dueDate})`,
      descriptionKm: `បានចាត់តាំងកិច្ចការ "${input.title}" ជូន ${person.name} (ថ្ងៃកំណត់៖ ${input.dueDate})`,
      metadata: { newValue: input.dueDate },
    });
    if (person.id !== user.id) {
      await notify(tx, {
        userId: person.id,
        type: 'task_assigned',
        groupId: groupId,
        targetId: rows[0].id,
        actorName: user.name,
        params: { title: input.title, dueDate: input.dueDate },
      });
    }
    created.push(rows[0].id);
  }
  return created;
}

tasksRouter.post('/groups/:groupId/tasks', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const access = await getGroupAccess(db, user, req.params.groupId);
  assertWritable(access);
  assert(access.canLead, 'Only team leads can assign tasks.');
  const input = createTaskSchema.parse(req.body);

  const ids = await db.transaction(tx => createTasksIn(tx, user, access.groupId, input));

  res.status(201).json({ id: ids[0], ids });
});

const importSchema = z.object({ tasks: z.array(createTaskSchema).min(1).max(200) });

// Many tasks at once (from a spreadsheet). All are created, or none.
tasksRouter.post('/groups/:groupId/tasks/import', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const access = await getGroupAccess(db, user, req.params.groupId);
  assertWritable(access);
  assert(access.canLead, 'Only team leads can assign tasks.');
  const { tasks } = importSchema.parse(req.body);

  const ids = await db.transaction(async tx => {
    const all: string[] = [];
    for (const input of tasks) all.push(...(await createTasksIn(tx, user, access.groupId, input)));
    return all;
  });

  res.status(201).json({ count: tasks.length, ids });
});

/** Single place that sets status and progress, and notifies the leads. */
async function applyStatus(
  tx: Queryable,
  user: User,
  task: any,
  status: 'todo' | 'in_progress' | 'ready_for_review',
  opts: { memberNotes?: string; progress?: number }
) {
  const isDone = status === 'ready_for_review';
  // Default: to do 0%, done 100%, in progress keeps its value
  const progress = opts.progress ?? (status === 'todo' ? 0 : isDone ? 100 : Math.min(task.progress ?? 0, 99));
  await tx.query(
    `UPDATE tasks SET status = $2,
            member_notes = COALESCE($3, member_notes),
            completed_at = CASE WHEN $4::boolean THEN COALESCE(completed_at, now()) ELSE NULL END,
            progress = $5,
            approved_at = NULL, approved_by = NULL
      WHERE id = $1`,
    [task.id, status, opts.memberNotes ?? null, isDone, progress]
  );
  if (isDone) {
    await logActivity(tx, user, {
      groupId: task.group_id,
      type: 'task_completed',
      targetId: task.id,
      targetTitle: task.title,
      description: `submitted task "${task.title}" as completed / ready for leader review`,
      descriptionKm: `បានបញ្ជាក់ការសម្រេចកិច្ចការ "${task.title}" រង់ចាំប្រធានត្រួតពិនិត្យ`,
    });
    if (task.status !== 'ready_for_review') {
      for (const leadId of await groupLeadIds(tx, task.group_id, user.id)) {
        await notify(tx, {
          userId: leadId,
          type: 'task_ready_for_review',
          groupId: task.group_id,
          targetId: task.id,
          actorName: user.name,
          params: { title: task.title },
        });
      }
    }
  }
}

const statusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'ready_for_review']),
  memberNotes: z.string().trim().max(5000).optional(),
});

tasksRouter.patch('/tasks/:taskId/status', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { task, access } = await loadTask(db, user, req.params.taskId);
  assertWritable(access);
  const isAssignee = task.assigned_to === user.id && access.canContribute;
  assert(isAssignee || access.canLead, 'Only the assignee or a team lead can update this task.');
  if (task.status === 'approved') throw badRequest('This task is approved and locked. A leader can reopen it to make changes.');
  const input = statusSchema.parse(req.body);

  await db.transaction(tx => applyStatus(tx, user, task, input.status, { memberNotes: input.memberNotes }));

  res.status(204).end();
});

const progressSchema = z.object({
  progress: z.number().int().min(0).max(100),
  memberNotes: z.string().trim().max(5000).optional(),
});

// Assignee or a team lead
tasksRouter.patch('/tasks/:taskId/progress', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { task, access } = await loadTask(db, user, req.params.taskId);
  assertWritable(access);
  const isAssignee = task.assigned_to === user.id && access.canContribute;
  assert(isAssignee || access.canLead, 'Only the assignee or a team lead can update this task.');
  if (task.status === 'approved') throw badRequest('This task has already been approved.');
  const input = progressSchema.parse(req.body);

  // 0% to do, 100% for review, else in progress
  const status = input.progress === 0 ? 'todo' : input.progress === 100 ? 'ready_for_review' : 'in_progress';
  await db.transaction(tx => applyStatus(tx, user, task, status, { memberNotes: input.memberNotes, progress: input.progress }));

  res.status(204).end();
});

const assigneeSchema = z.object({ assignedTo: z.string().uuid() });

tasksRouter.patch('/tasks/:taskId/assignee', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { task, access } = await loadTask(db, user, req.params.taskId);
  assertWritable(access);
  assert(access.canLead, 'Only team leads can reassign tasks.');
  const input = assigneeSchema.parse(req.body);
  if (task.status === 'approved') throw badRequest('An approved task cannot be reassigned.');
  if (input.assignedTo === task.assigned_to) {
    res.status(204).end();
    return;
  }

  await db.transaction(async tx => {
    const assignee = await loadAssignee(tx, task.group_id, input.assignedTo);
    if (task.batch_id) {
      const { rows: twin } = await tx.query(
        'SELECT 1 FROM tasks WHERE batch_id = $1 AND assigned_to = $2 AND is_active = 1 AND id <> $3',
        [task.batch_id, input.assignedTo, task.id]
      );
      if (twin[0]) throw badRequest('This person already has a copy of this team task.');
    }
    const { rows: before } = task.assigned_to
      ? await tx.query('SELECT name FROM users WHERE id = $1', [task.assigned_to])
      : { rows: [] as any[] };
    const from = before[0]?.name ?? '-';

    // The new person starts fresh, without the old person's progress
    await tx.query(
      `UPDATE tasks SET assigned_to = $2, status = 'todo', progress = 0, member_notes = NULL, completed_at = NULL WHERE id = $1`,
      [task.id, input.assignedTo]
    );
    await logActivity(tx, user, {
      groupId: task.group_id,
      type: 'task_assigned',
      targetId: task.id,
      targetTitle: task.title,
      description: `reassigned task "${task.title}" from ${from} to ${assignee.name}`,
      descriptionKm: `បានប្តូរអ្នកទទួលកិច្ចការ "${task.title}" ពី ${from} ទៅ ${assignee.name}`,
    });
    if (input.assignedTo !== user.id) {
      await notify(tx, {
        userId: input.assignedTo,
        type: 'task_assigned',
        groupId: task.group_id,
        targetId: task.id,
        actorName: user.name,
        params: { title: task.title, dueDate: task.due_date },
      });
    }
  });

  res.status(204).end();
});

/** A team task is one card, so a new date applies to every copy that is not approved. */
async function scheduleTargets(tx: Queryable, task: any): Promise<any[]> {
  if (!task.batch_id) return [task];
  const { rows } = await tx.query(`SELECT * FROM tasks WHERE batch_id = $1 AND is_active = 1 AND status <> 'approved'`, [task.batch_id]);
  return rows.length > 0 ? rows : [task];
}

const deadlineSchema =z.object({ dueDate: isoDate, dueTime: time.optional() });

tasksRouter.patch('/tasks/:taskId/deadline', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { task, access } = await loadTask(db, user, req.params.taskId);
  assertWritable(access);
  assert(access.canLead, 'Only team leads can change task deadlines.');
  if (task.status === 'approved') throw badRequest('An approved task cannot be rescheduled. Reopen it first.');
  const input = deadlineSchema.parse(req.body);

  await db.transaction(async tx => {
    for (const target of await scheduleTargets(tx, task)) {
      const startDate = target.start_date <= input.dueDate ? target.start_date : input.dueDate;
      await applySchedule(tx, user, target, { startDate, dueDate: input.dueDate, dueTime: input.dueTime });
    }
  });

  res.status(204).end();
});

const scheduleSchema = z
  .object({ startDate: isoDate, dueDate: isoDate, dueTime: time.optional() })
  .refine(v => v.startDate <= v.dueDate, { message: START_AFTER_DUE, path: ['startDate'] });

tasksRouter.patch('/tasks/:taskId/schedule', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { task, access } = await loadTask(db, user, req.params.taskId);
  assertWritable(access);
  assert(access.canLead, 'Only team leads can change the schedule.');
  if (task.status === 'approved') throw badRequest('An approved task cannot be rescheduled. Reopen it first.');
  const input = scheduleSchema.parse(req.body);

  // The timeline moves one person's bar, so only this task changes (the due date chip changes the whole team task)
  await db.transaction(tx => applySchedule(tx, user, task, input));
  res.status(204).end();
});

const approveSchema = z.object({ feedback: z.string().trim().max(2000).optional() });

/** Signs off one task that is waiting for review. */
async function approveOne(tx: Queryable, user: User, task: any, feedback?: string) {
  await tx.query(
    `UPDATE tasks SET status = 'approved', approved_at = now(), approved_by = $2,
            completed_at = COALESCE(completed_at, now()), leader_feedback = $3
      WHERE id = $1`,
    [task.id, user.id, feedback || 'Approved by Leader.']
  );
  await logActivity(tx, user, {
    groupId: task.group_id,
    type: 'task_approved',
    targetId: task.id,
    targetTitle: task.title,
    description: `approved and signed off on task "${task.title}"`,
    descriptionKm: `បានអនុម័ត និងចុះហត្ថលេខាទទួលស្គាល់កិច្ចការ "${task.title}"`,
    metadata: feedback ? { feedback } : undefined,
  });
  if (task.assigned_to && task.assigned_to !== user.id) {
    await notify(tx, {
      userId: task.assigned_to,
      type: 'task_approved',
      groupId: task.group_id,
      targetId: task.id,
      actorName: user.name,
      params: { title: task.title, feedback },
    });
  }
}

tasksRouter.post('/tasks/:taskId/approve', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { task, access } = await loadTask(db, user, req.params.taskId);
  assertWritable(access);
  assert(access.canLead, 'Only team leads can approve tasks.');
  const input = approveSchema.parse(req.body ?? {});
  if (task.status === 'approved') throw conflict('This task is already approved.');
  if (task.status !== 'ready_for_review') throw badRequest('Only a task that is ready for review can be approved.');

  await db.transaction(tx => approveOne(tx, user, task, input.feedback));
  res.status(204).end();
});

// Approve everything that is waiting for review in one go. Tasks in another state are skipped.
const bulkApproveSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1).max(200),
  feedback: z.string().trim().max(2000).optional(),
});

tasksRouter.post('/groups/:groupId/tasks/approve', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const access = await getGroupAccess(db, user, req.params.groupId);
  assertWritable(access);
  assert(access.canLead, 'Only team leads can approve tasks.');
  const input = bulkApproveSchema.parse(req.body);

  const count = await db.transaction(async tx => {
    let done = 0;
    for (const id of new Set(input.taskIds)) {
      const { rows } = await tx.query(
        `SELECT * FROM tasks WHERE id = $1 AND group_id = $2 AND is_active = 1 AND status = 'ready_for_review'`,
        [id, access.groupId]
      );
      if (!rows[0]) continue;
      await approveOne(tx, user, rows[0], input.feedback);
      done++;
    }
    return done;
  });

  res.json({ count });
});

// The leader sends work back with a reason. The person keeps working, and is told why.
const changesSchema = z.object({ feedback: z.string().trim().min(1).max(2000) });

tasksRouter.post('/tasks/:taskId/request-changes', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { task, access } = await loadTask(db, user, req.params.taskId);
  assertWritable(access);
  assert(access.canLead, 'Only team leads can ask for changes.');
  const input = changesSchema.parse(req.body);
  if (task.status !== 'ready_for_review') throw badRequest('Only a task that is waiting for review can be sent back.');

  await db.transaction(async tx => {
    await tx.query(
      `UPDATE tasks SET status = 'in_progress', progress = LEAST(progress, 99), completed_at = NULL,
              approved_at = NULL, approved_by = NULL, leader_feedback = $2
        WHERE id = $1`,
      [task.id, input.feedback]
    );
    await logActivity(tx, user, {
      groupId: task.group_id,
      type: 'task_changes_requested',
      targetId: task.id,
      targetTitle: task.title,
      description: `asked for changes on task "${task.title}"`,
      descriptionKm: `បានស្នើសុំកែកិច្ចការ "${task.title}"`,
      metadata: { feedback: input.feedback },
    });
    if (task.assigned_to && task.assigned_to !== user.id) {
      await notify(tx, {
        userId: task.assigned_to,
        type: 'task_changes_requested',
        groupId: task.group_id,
        targetId: task.id,
        actorName: user.name,
        params: { title: task.title, feedback: input.feedback },
      });
    }
  });

  res.status(204).end();
});

// Change what the task says. A team task changes for everyone who has it.
const detailsSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    module: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(5000).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
  })
  .refine(v => Object.keys(v).length > 0, { message: 'Nothing to change.' });

tasksRouter.patch('/tasks/:taskId', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { task, access } = await loadTask(db, user, req.params.taskId);
  assertWritable(access);
  assert(access.canLead, 'Only team leads can edit tasks.');
  if (task.status === 'approved') throw badRequest('This task is approved and locked. A leader can reopen it to make changes.');
  const input = detailsSchema.parse(req.body);

  await db.transaction(async tx => {
    await tx.query(
      `UPDATE tasks SET title = COALESCE($3, title), module = COALESCE($4, module),
              description = COALESCE($5, description), priority = COALESCE($6, priority)
        WHERE is_active = 1 AND status <> 'approved' AND (id = $1 OR ($2::uuid IS NOT NULL AND batch_id = $2::uuid))`,
      [task.id, task.batch_id ?? null, input.title ?? null, input.module ?? null, input.description ?? null, input.priority ?? null]
    );
    await logActivity(tx, user, {
      groupId: task.group_id,
      type: 'task_edited',
      targetId: task.id,
      targetTitle: input.title ?? task.title,
      description: `edited task "${task.title}"`,
      descriptionKm: `បានកែកិច្ចការ "${task.title}"`,
    });
  });

  res.status(204).end();
});

tasksRouter.post('/tasks/:taskId/reopen', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { task, access } = await loadTask(db, user, req.params.taskId);
  assertWritable(access);
  assert(access.canLead, 'Only team leads can reopen tasks.');
  if (task.status !== 'approved') throw badRequest('Only an approved task can be reopened.');

  await db.transaction(async tx => {
    await tx.query(`UPDATE tasks SET status = 'ready_for_review', approved_at = NULL, approved_by = NULL WHERE id = $1`, [task.id]);
    await logActivity(tx, user, {
      groupId: task.group_id,
      type: 'task_completed',
      targetId: task.id,
      targetTitle: task.title,
      description: `reopened task "${task.title}" for changes`,
      descriptionKm: `បានបើកកិច្ចការ "${task.title}" ឡើងវិញដើម្បីកែ`,
    });
  });

  res.status(204).end();
});

tasksRouter.delete('/groups/:groupId/task-batches/:batchId', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const access = await getGroupAccess(db, user, req.params.groupId);
  assertWritable(access);
  assert(access.canLead, 'Only team leads can delete tasks.');
  const { rows } = await db.query('UPDATE tasks SET is_active = 0 WHERE group_id = $1 AND batch_id = $2 AND is_active = 1 RETURNING id', [
    access.groupId,
    req.params.batchId,
  ]);
  if (rows.length === 0) throw notFound('Task not found.');
  res.status(204).end();
});

tasksRouter.delete('/tasks/:taskId', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { task, access } = await loadTask(db, user, req.params.taskId);
  assertWritable(access);
  assert(access.canLead, 'Only team leads can delete tasks.');
  await db.query('UPDATE tasks SET is_active = 0 WHERE id = $1', [task.id]);
  res.status(204).end();
});
