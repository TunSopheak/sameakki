// Each migration runs once, in order. Never edit an old one.

export const migrations: { id: string; sql: string }[] = [
  {
    id: '001_initial_schema',
    sql: `
      CREATE TABLE users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name          TEXT NOT NULL,
        name_km       TEXT,
        email         TEXT NOT NULL,
        student_id    TEXT NOT NULL,
        password_hash TEXT,
        role          TEXT NOT NULL DEFAULT 'member'
                      CHECK (role IN ('super_admin', 'team_lead', 'member', 'viewer')),
        specialty     TEXT,
        department    TEXT,
        avatar_url    TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX users_email_unique ON users (lower(email));
      CREATE UNIQUE INDEX users_student_id_unique ON users (lower(student_id));

      CREATE TABLE groups (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name              TEXT NOT NULL,
        name_km           TEXT,
        code              TEXT NOT NULL,
        description       TEXT NOT NULL DEFAULT '',
        course_or_project TEXT NOT NULL DEFAULT '',
        leader_id         UUID REFERENCES users(id) ON DELETE SET NULL,
        deadline          DATE,
        status            TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'completed', 'archived')),
        category          TEXT NOT NULL DEFAULT 'assignment'
                          CHECK (category IN ('assignment', 'research', 'startup', 'other')),
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX groups_code_unique ON groups (upper(code));

      CREATE TABLE group_members (
        group_id  UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (group_id, user_id)
      );
      CREATE INDEX group_members_user_idx ON group_members (user_id);

      CREATE TABLE tasks (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        title           TEXT NOT NULL,
        module          TEXT NOT NULL DEFAULT 'General',
        description     TEXT NOT NULL DEFAULT '',
        assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
        assigned_by     UUID REFERENCES users(id) ON DELETE SET NULL,
        priority        TEXT NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        status          TEXT NOT NULL DEFAULT 'todo'
                        CHECK (status IN ('todo', 'in_progress', 'ready_for_review', 'approved')),
        due_date        DATE NOT NULL,
        due_time        TEXT,
        member_notes    TEXT,
        leader_feedback TEXT,
        completed_at    TIMESTAMPTZ,
        approved_at     TIMESTAMPTZ,
        approved_by     UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX tasks_group_idx ON tasks (group_id);

      CREATE TABLE daily_logs (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id       UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        log_date       DATE NOT NULL,
        title          TEXT NOT NULL,
        raw_content    TEXT NOT NULL,
        items          JSONB NOT NULL DEFAULT '[]'::jsonb,
        status         TEXT NOT NULL DEFAULT 'in_progress'
                       CHECK (status IN ('in_progress', 'completed', 'approved')),
        completed_at   TIMESTAMPTZ,
        leader_checked BOOLEAN NOT NULL DEFAULT false,
        leader_note    TEXT,
        approved_by    UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX daily_logs_group_idx ON daily_logs (group_id, created_at DESC);

      CREATE TABLE daily_log_reactions (
        log_id     UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        emoji      TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (log_id, user_id, emoji)
      );

      CREATE TABLE activity_events (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id       UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        type           TEXT NOT NULL,
        actor_id       UUID REFERENCES users(id) ON DELETE SET NULL,
        actor_name     TEXT NOT NULL,
        target_id      TEXT,
        target_title   TEXT NOT NULL DEFAULT '',
        description    TEXT NOT NULL,
        description_km TEXT,
        metadata       JSONB,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX activity_events_group_idx ON activity_events (group_id, created_at DESC);
    `,
  },
  {
    id: '002_drop_student_id_add_username',
    sql: `
      ALTER TABLE users DROP COLUMN student_id;
      ALTER TABLE users ADD COLUMN username TEXT;
      CREATE UNIQUE INDEX users_username_unique ON users (lower(username)) WHERE username IS NOT NULL;
    `,
  },
  {
    id: '003_avatar_key',
    sql: `ALTER TABLE users RENAME COLUMN avatar_url TO avatar`,
  },
  {
    id: '004_last_seen',
    sql: `ALTER TABLE users ADD COLUMN last_seen_at TIMESTAMPTZ`,
  },
  {
    // is_active: 1 = in use, 0 = deleted (kept for history), 2 = old version (reserved)
    id: '005_soft_delete',
    sql: `
      ALTER TABLE users ADD COLUMN is_active SMALLINT NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1, 2));
      ALTER TABLE groups ADD COLUMN is_active SMALLINT NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1, 2));
      DROP INDEX users_email_unique;
      DROP INDEX users_username_unique;
      CREATE UNIQUE INDEX users_email_unique ON users (lower(email)) WHERE is_active = 1;
      CREATE UNIQUE INDEX users_username_unique ON users (lower(username)) WHERE username IS NOT NULL AND is_active = 1;
    `,
  },
  {
    id: '006_soft_delete_work',
    sql: `
      ALTER TABLE tasks ADD COLUMN is_active SMALLINT NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1, 2));
      ALTER TABLE daily_logs ADD COLUMN is_active SMALLINT NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1, 2));
    `,
  },
  {
    // expires_at ends access; max_members limits a leader's groups
    id: '007_account_plan',
    sql: `
      ALTER TABLE users ADD COLUMN expires_at TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN max_members INTEGER CHECK (max_members IS NULL OR max_members > 0);
      ALTER TABLE users ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;
    `,
  },
  {
    id: '008_must_change_password',
    sql: `ALTER TABLE users ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT false`,
  },
  {
    id: '009_notifications',
    sql: `
      CREATE TABLE notifications (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type       TEXT NOT NULL,
        group_id   UUID REFERENCES groups(id) ON DELETE CASCADE,
        target_id  TEXT,
        actor_name TEXT,
        params     JSONB NOT NULL DEFAULT '{}'::jsonb,
        dedupe_key TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        read_at    TIMESTAMPTZ
      );
      CREATE INDEX notifications_user_idx ON notifications (user_id, created_at DESC);
      CREATE UNIQUE INDEX notifications_dedupe_unique ON notifications (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
    `,
  },
  {
    id: '010_comments',
    sql: `
      CREATE TABLE comments (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        target_type TEXT NOT NULL CHECK (target_type IN ('task', 'daily_log')),
        target_id   UUID NOT NULL,
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body        TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        is_active   SMALLINT NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
      );
      CREATE INDEX comments_target_idx ON comments (target_type, target_id, created_at);
    `,
  },
  {
    id: '011_support_access',
    sql: `ALTER TABLE groups ADD COLUMN support_access_until TIMESTAMPTZ`,
  },
  {
    id: '012_site_settings',
    sql: `
      CREATE TABLE site_settings (
        key        TEXT PRIMARY KEY,
        value      JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `,
  },
  {
    id: '013_token_version',
    sql: `ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0`,
  },
  {
    // Gantt: tasks run from start_date to due_date
    id: '014_task_start_date',
    sql: `
      ALTER TABLE tasks ADD COLUMN start_date DATE;
      UPDATE tasks SET start_date = LEAST((created_at AT TIME ZONE 'Asia/Phnom_Penh')::date, due_date);
      ALTER TABLE tasks ALTER COLUMN start_date SET NOT NULL;
      ALTER TABLE tasks ADD CONSTRAINT tasks_start_not_after_due CHECK (start_date <= due_date);
    `,
  },
  {
    // Tasks given to several people share a batch
    id: '015_task_batch',
    sql: `
      ALTER TABLE tasks ADD COLUMN batch_id UUID;
      CREATE INDEX tasks_batch_idx ON tasks (batch_id) WHERE batch_id IS NOT NULL;
    `,
  },
  {
    // Task progress, 0 to 100
    id: '016_task_progress',
    sql: `
      ALTER TABLE tasks ADD COLUMN progress SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100);
      UPDATE tasks SET progress = 100 WHERE status IN ('ready_for_review', 'approved');
    `,
  },
  {
    // Specialty per group, users.specialty is the fallback
    id: '017_member_specialty',
    sql: `
      ALTER TABLE group_members ADD COLUMN specialty TEXT;
      UPDATE group_members m SET specialty = u.specialty FROM users u WHERE u.id = m.user_id AND u.specialty IS NOT NULL;
    `,
  },
  {
    id: '018_comment_edited',
    sql: `ALTER TABLE comments ADD COLUMN edited_at TIMESTAMPTZ`,
  },
  {
    id: '019_daily_log_edited',
    sql: `ALTER TABLE daily_logs ADD COLUMN edited_at TIMESTAMPTZ`,
  },
  {
    // A poke nudges a member who has not posted today. One per person pair per day.
    id: '020_pokes',
    sql: `
      CREATE TABLE pokes (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id     UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        to_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        poke_date    DATE NOT NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX pokes_once_a_day ON pokes (group_id, from_user_id, to_user_id, poke_date);
    `,
  },
  {
    // Optional Telegram messages. The chat id is private and never sent to the browser.
    id: '021_telegram',
    sql: `
      ALTER TABLE users ADD COLUMN telegram_chat_id TEXT;
      ALTER TABLE users ADD COLUMN telegram_link_token TEXT;
      ALTER TABLE users ADD COLUMN telegram_link_expires TIMESTAMPTZ;
      CREATE UNIQUE INDEX users_telegram_chat_unique ON users (telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;
      CREATE UNIQUE INDEX users_telegram_token_unique ON users (telegram_link_token) WHERE telegram_link_token IS NOT NULL;
    `,
  },
  {
    // Which language Telegram messages use, and whether every notification goes there or only pokes
    id: '022_telegram_prefs',
    sql: `
      ALTER TABLE users ADD COLUMN telegram_language TEXT NOT NULL DEFAULT 'km' CHECK (telegram_language IN ('km', 'en'));
      ALTER TABLE users ADD COLUMN telegram_all BOOLEAN NOT NULL DEFAULT true;
    `,
  },
];
