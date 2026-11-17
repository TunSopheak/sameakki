import React, { useState } from 'react';
import type { Comment } from '@shared/types';
import { useApp } from '../../context/AppContext';
import { formatDateTime } from '../../lib/dates';
import { timeAgo } from '../../lib/notificationText';
import { Avatar } from '../Avatar';
import { CommentForm } from './CommentForm';

interface CommentItemProps {
  comment: Comment;
  onEdit: (body: string) => Promise<boolean>;
  onDelete: () => void;
}

const action = 'cursor-pointer text-[11px] font-semibold text-neutral-500 hover:text-black';

export const CommentItem: React.FC<CommentItemProps> = ({ comment, onEdit, onDelete }) => {
  const { t, language, currentUser, canContribute, isTeamLead, isDemo } = useApp();
  const [editing, setEditing] = useState(false);

  const mine = comment.userId === currentUser.id;
  const name = language === 'km' && comment.userNameKm ? comment.userNameKm : comment.userName;
  const roleBadge = comment.userRole === 'team_lead' ? t.teamLeadBadge : comment.userRole === 'super_admin' ? t.superAdminBadge : null;

  return (
    <li className="flex items-start gap-2.5">
      <Avatar name={comment.userName} avatar={comment.avatar} className="mt-0.5 size-7 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="truncate text-xs font-semibold text-black">{name}</span>
          {roleBadge && <span className="rounded-md bg-brand-soft px-1.5 py-px text-[11px] font-semibold text-brand-ink">{roleBadge}</span>}
          {mine && <span className="text-[11px] text-neutral-500">({t.youLabel})</span>}
          <span title={formatDateTime(comment.createdAt)} className="text-[11px] text-neutral-500">
            {timeAgo(comment.createdAt, language)}
          </span>
          {comment.editedAt && <span className="text-[11px] italic text-neutral-500">· {t.commentEdited}</span>}
        </div>

        {editing ? (
          <div className="mt-1.5">
            <CommentForm
              initial={comment.body}
              placeholder={t.commentPlaceholder}
              submitLabel={t.save}
              autoFocus
              onCancel={() => setEditing(false)}
              onSubmit={async body => {
                const saved = body === comment.body || (await onEdit(body));
                if (saved) setEditing(false);
                return saved;
              }}
            />
          </div>
        ) : (
          <>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-800">{comment.body}</p>
            {!isDemo && (
              <div className="mt-1 flex items-center gap-3">
                {mine && canContribute && (
                  <button type="button" onClick={() => setEditing(true)} className={action}>
                    {t.commentEdit}
                  </button>
                )}
                {(mine || isTeamLead) && (
                  <button type="button" onClick={onDelete} className={action}>
                    {t.delete}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </li>
  );
};
