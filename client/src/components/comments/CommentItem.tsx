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
    <li className={`spring-in group flex items-start gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
      <Avatar name={comment.userName} avatar={comment.avatar} className="mt-0.5 size-8 shrink-0 ring-2 ring-white" />
      <div className={`flex min-w-0 max-w-[85%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
        <div className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 px-1 ${mine ? 'justify-end' : ''}`}>
          <span className="truncate text-xs font-semibold text-black">{name}</span>
          {roleBadge && <span className="rounded-md bg-brand-soft px-1.5 py-px text-[11px] font-semibold text-brand-ink">{roleBadge}</span>}
          <span title={formatDateTime(comment.createdAt)} className="text-[11px] text-neutral-500">
            {timeAgo(comment.createdAt, language)}
          </span>
          {comment.editedAt && <span className="text-[11px] italic text-neutral-500">· {t.commentEdited}</span>}
        </div>

        {editing ? (
          <div className="mt-1.5 w-full min-w-64">
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
            <p
              className={`mt-0.5 whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-xs ${
                mine ? 'rounded-tr-md bg-brand text-white' : 'rounded-tl-md border border-neutral-200 bg-white text-neutral-800'
              }`}
            >
              {comment.body}
            </p>
            {!isDemo && (
              <div className="mt-1 flex items-center gap-3 px-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
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
