import React, { useState } from 'react';
import { CalendarRange, LayoutGrid } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Segmented } from './timeline/Segmented';
import { TimelineView } from './timeline/TimelineView';
import { TaskBoard } from './TaskBoard';

type View = 'list' | 'timeline';
const STORAGE_KEY = 'leadersync_tasks_view';

const readView = (): View => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'timeline' ? 'timeline' : 'list';
  } catch {
    return 'list';
  }
};

/** The Tasks page: the same tasks as cards, or as a timeline. The choice is remembered. */
export const TasksTab: React.FC<{ onOpenAssignTask: () => void }> = ({ onOpenAssignTask }) => {
  const { t } = useApp();
  const [view, setView] = useState<View>(readView);

  const choose = (next: View) => {
    setView(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable (private mode): the choice just lasts for this visit */
    }
  };

  return (
    <div className="space-y-4">
      <Segmented
        label={t.viewLabel}
        value={view}
        onChange={choose}
        options={[
          { value: 'list', label: t.viewList, icon: LayoutGrid },
          { value: 'timeline', label: t.viewTimeline, icon: CalendarRange },
        ]}
      />
      {view === 'list' ? <TaskBoard onOpenAssignTask={onOpenAssignTask} /> : <TimelineView onOpenAssignTask={onOpenAssignTask} />}
    </div>
  );
};
