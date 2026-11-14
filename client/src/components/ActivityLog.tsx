import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateTime } from '../lib/dates';
import { ActivityEventType } from '../types';
import { SearchBox } from './TableParts';
import {
  History,
  CheckCircle2,
  Award,
  UserPlus,
  UserMinus,
  Calendar,
  Clock,
  Sparkles,
  CheckSquare,
  Shield,
  Layers
} from 'lucide-react';

interface ActivityLogProps {
  maxItems?: number;
  showFilters?: boolean;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  maxItems,
  showFilters = true,
}) => {
  const {
    activeGroupActivityEvents,
    language,
    isSuperAdmin,
    clearActivityLogs,
    t,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  const [filterType, setFilterType] = useState<'all' | 'tasks' | 'members' | 'deadlines' | 'standups'>('all');

  const getEventBadge = (type: ActivityEventType) => {
    switch (type) {
      case 'task_completed':
        return {
          icon: <CheckSquare className="w-3.5 h-3.5 text-black" />,
          label: language === 'km' ? 'កិច្ចការសម្រេច' : 'Task Completed',
          tag: 'TASK DONE',
        };
      case 'task_approved':
        return {
          icon: <Award className="w-3.5 h-3.5 text-white" />,
          label: language === 'km' ? 'បានអនុម័ត' : 'Task Approved',
          tag: 'APPROVED',
          isBlack: true,
        };
      case 'task_assigned':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-black" />,
          label: language === 'km' ? 'ចាត់តាំងការងារ' : 'Task Assigned',
          tag: 'ASSIGNED',
        };
      case 'task_deadline_changed':
      case 'group_deadline_changed':
        return {
          icon: <Calendar className="w-3.5 h-3.5 text-black" />,
          label: language === 'km' ? 'ប្តូរ Deadline' : 'Deadline Change',
          tag: 'DEADLINE',
        };
      case 'member_added':
        return {
          icon: <UserPlus className="w-3.5 h-3.5 text-black" />,
          label: language === 'km' ? 'បន្ថែមសមាជិក' : 'Member Added',
          tag: 'MEMBER +',
        };
      case 'member_removed':
        return {
          icon: <UserMinus className="w-3.5 h-3.5 text-black" />,
          label: language === 'km' ? 'ដកសមាជិក' : 'Member Removed',
          tag: 'MEMBER -',
        };
      case 'member_role_changed':
        return {
          icon: <Shield className="w-3.5 h-3.5 text-black" />,
          label: language === 'km' ? 'ប្តូរសិទ្ធិ' : 'Role Updated',
          tag: 'ROLE',
        };
      case 'daily_todo_posted':
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-black" />,
          label: language === 'km' ? 'ToDo ថ្មី' : 'Daily ToDo',
          tag: 'STANDUP',
        };
      case 'daily_todo_completed':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-black" />,
          label: language === 'km' ? 'ToDo សម្រេច' : 'Standup Done',
          tag: 'STANDUP DONE',
        };
      case 'daily_todo_approved':
        return {
          icon: <Award className="w-3.5 h-3.5 text-white" />,
          label: language === 'km' ? 'អនុម័ត ToDo' : 'Standup Approved',
          tag: 'VERIFIED',
          isBlack: true,
        };
      case 'group_created':
      default:
        return {
          icon: <Layers className="w-3.5 h-3.5 text-black" />,
          label: language === 'km' ? 'ក្រុមថ្មី' : 'Group Created',
          tag: 'GROUP',
        };
    }
  };

  const filteredEvents = activeGroupActivityEvents.filter(ev => {
    if (filterType === 'tasks') {
      if (!['task_completed', 'task_approved', 'task_assigned'].includes(ev.type)) return false;
    } else if (filterType === 'members') {
      if (!['member_added', 'member_removed', 'member_role_changed'].includes(ev.type)) return false;
    } else if (filterType === 'deadlines') {
      if (!['task_deadline_changed', 'group_deadline_changed'].includes(ev.type)) return false;
    } else if (filterType === 'standups') {
      if (!['daily_todo_posted', 'daily_todo_completed', 'daily_todo_approved'].includes(ev.type)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        ev.actorName.toLowerCase().includes(q) ||
        ev.targetTitle.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        (ev.descriptionKm && ev.descriptionKm.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const displayedEvents = maxItems ? filteredEvents.slice(0, maxItems) : filteredEvents;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-black tracking-tight">
                {language === 'km' ? 'កំណត់ត្រាសកម្មភាពក្រុម' : 'Group Activity Log'}
              </h3>
              <span className="text-[11px] px-1.5 py-0.2 rounded-lg bg-neutral-100 text-neutral-800 border border-neutral-200 font-bold">
                {activeGroupActivityEvents.length}
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              {language === 'km'
                ? 'តាមដានព្រឹត្តិការណ៍សំខាន់ៗ៖ ការសម្រេចកិច្ចការ, ការបន្ថែមសមាជិក, ការប្តូរ Deadline'
                : 'Tracks major events: task completions, member additions, and deadline updates'}
            </p>
          </div>
        </div>

        {isSuperAdmin && activeGroupActivityEvents.length > 0 && (
          <button
            onClick={() => {
              if (confirm(language === 'km' ? 'សម្អាតប្រវត្តិសកម្មភាពរបស់ក្រុមនេះ?' : 'Clear activity history for this group?')) {
                clearActivityLogs();
              }
            }}
            className="text-[11px] text-neutral-500 hover:text-black hover:underline cursor-pointer self-start sm:self-auto"
          >
            {language === 'km' ? 'សម្អាតប្រវត្តិ' : 'Clear log history'}
          </button>
        )}
      </div>

      {showFilters && (
        <div className="py-3 border-b border-neutral-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-semibold cursor-pointer ${
                filterType === 'all'
                  ? 'bg-brand text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'km' ? 'ទាំងអស់' : 'All'}
            </button>
            <button
              onClick={() => setFilterType('tasks')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-semibold cursor-pointer ${
                filterType === 'tasks'
                  ? 'bg-brand text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'km' ? 'កិច្ចការ' : 'Tasks'}
            </button>
            <button
              onClick={() => setFilterType('deadlines')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-semibold cursor-pointer ${
                filterType === 'deadlines'
                  ? 'bg-brand text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'km' ? 'Deadlines' : 'Deadlines'}
            </button>
            <button
              onClick={() => setFilterType('members')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-semibold cursor-pointer ${
                filterType === 'members'
                  ? 'bg-brand text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'km' ? 'សមាជិក' : 'Members'}
            </button>
            <button
              onClick={() => setFilterType('standups')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-semibold cursor-pointer ${
                filterType === 'standups'
                  ? 'bg-brand text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'km' ? 'Daily ToDo' : 'Standups'}
            </button>
          </div>

          <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder={t.searchActivity} />
        </div>
      )}

      <div className="pt-4">
        {displayedEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-200">
            <Clock className="w-6 h-6 text-neutral-400 mx-auto mb-1.5" />
            <span className="font-semibold block text-neutral-700">
              {language === 'km' ? 'មិនទាន់មានកំណត់ត្រាសកម្មភាពនៅឡើយទេ' : 'No activity recorded yet'}
            </span>
            <span className="text-[11px] text-neutral-500">
              {language === 'km' ? 'សកម្មភាពដូចជាការបញ្ចប់ការងារ ការបន្ថែមសមាជិក ឬការប្តូរ Deadline នឹងបង្ហាញនៅទីនេះ' : 'Major events like task completions and deadline changes will show here'}
            </span>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-neutral-200">
            {displayedEvents.map(event => {
              const badge = getEventBadge(event.type);

              return (
                <div key={event.id} className="relative group">
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-lg flex items-center justify-center border shadow-2xs ${
                      badge.isBlack
                        ? 'bg-brand border-brand text-white'
                        : 'bg-white border-neutral-200 text-black'
                    }`}
                  >
                    {badge.icon}
                  </div>

                  <div className="p-3 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200 rounded-lg transition-colors text-xs space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-black">
                          {event.actorName}
                        </span>
                        <span className="text-neutral-500">
                          {language === 'km' && event.descriptionKm ? event.descriptionKm : event.description}
                        </span>
                      </div>

                      <span className="text-[11px] text-neutral-500 shrink-0">
                        {formatDateTime(event.timestamp)}
                      </span>
                    </div>

                    {event.targetTitle && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[11px] px-1.5 py-0.2 rounded-lg bg-white text-black font-semibold border border-neutral-200">
                          {badge.tag}
                        </span>
                        <span className="font-semibold text-black truncate max-w-md">
                          "{event.targetTitle}"
                        </span>
                        {event.metadata?.newValue && (
                          <span className="text-[11px] text-neutral-600 bg-neutral-200 px-1.5 py-0.2 rounded-lg">
                            → {event.metadata.newValue}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
