import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { TaskPriority } from '../types';
import { addDays } from '../lib/dates';
import { Plus, X } from 'lucide-react';

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({ isOpen, onClose }) => {
  const { assignTask, activeGroupMembers, t, language } = useApp();

  const [title, setTitle] = useState('');
  const [module, setModule] = useState('General');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState(() => addDays(5));
  const [dueTime, setDueTime] = useState('18:00');
  const [submitting, setSubmitting] = useState(false);

  // Start fresh each time the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate(addDays(5));
    setDueTime('18:00');
    setAssignedTo(activeGroupMembers[0]?.id || '');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedTo || submitting) return;

    setSubmitting(true);
    try {
      await assignTask({
        title: title.trim(),
        module: module.trim() || 'General',
        description: description.trim() || 'Deliver specified module requirements.',
        assignedTo,
        priority,
        dueDate,
        dueTime,
      });
      onClose();
    } catch {
      // Error is shown as a notice; keep the form open.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="modal-panel bg-white rounded-xl max-w-lg w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">{t.assignNewTask}</h2>
              <p className="text-xs text-neutral-500">
                {language === 'km' ? 'កំណត់កិច្ចការ និងកាលបរិច្ឆេទដល់សមាជិកក្រុម' : 'Define deliverable and deadline for a member'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {t.taskTitle} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t.taskTitlePlaceholder}
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {t.taskModule} *
            </label>
            <input
              type="text"
              required
              value={module}
              onChange={e => setModule(e.target.value)}
              placeholder="e.g. Website"
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black mb-1">
                {t.taskAssignTo} *
              </label>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
              >
                {activeGroupMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-1">
                {t.taskPriority}
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
              >
                <option value="low">{t.taskPriorityLow}</option>
                <option value="medium">{t.taskPriorityMedium}</option>
                <option value="high">{t.taskPriorityHigh}</option>
                <option value="urgent">{t.taskPriorityUrgent}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black mb-1">
                {t.taskDeadline} *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-1">
                {t.taskTime}
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {t.taskDescription}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Details (optional)"
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-dark disabled:opacity-60 rounded-lg shadow-xs"
            >
              {t.btnAssign}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
