import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Segmented } from './timeline/Segmented';
import { TimelineView } from './timeline/TimelineView';
import { TaskBoard } from './TaskBoard';
import { Icons } from './icons';

type View = 'list' | 'timeline';
const STORAGE_KEY = 'sameakki_tasks_view';

const readView = (): View => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'timeline' ? 'timeline' : 'list';
  } catch {
    return 'list';
  }
};

/** Tasks page: cards or timeline. */
export const TasksTab: React.FC<{ onOpenAssignTask: () => void }> = ({ onOpenAssignTask }) => {
  const { t } = useApp();
  const [view, setView] = useState<View>(readView);

  const choose = (next: View) => {
    setView(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* no storage */
    }
  };

  return (
    <div className="space-y-4">
      <Segmented
        label={t.viewLabel}
        value={view}
        onChange={choose}
        options={[
          { value: 'list', label: t.viewList, icon: Icons.list },
          { value: 'timeline', label: t.viewTimeline, icon: Icons.timeline },
        ]}
      />
      {view === 'list' ? <TaskBoard onOpenAssignTask={onOpenAssignTask} /> : <TimelineView onOpenAssignTask={onOpenAssignTask} />}
    </div>
  );
};
