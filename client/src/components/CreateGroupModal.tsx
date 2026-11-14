import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icons } from './icons';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const { createGroup, t } = useApp();

  const [name, setName] = useState('');
  const [nameKm, setNameKm] = useState('');
  const [code, setCode] = useState('');
  const [courseOrProject, setCourseOrProject] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState<'assignment' | 'research' | 'startup' | 'other'>('assignment');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setNameKm('');
    setCode('');
    setCourseOrProject('');
    setDescription('');
    setDeadline('');
    setCategory('assignment');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !courseOrProject.trim() || submitting) return;

    setSubmitting(true);
    try {
      await createGroup({
        name: name.trim(),
        nameKm: nameKm.trim() || undefined,
        code: code.trim(),
        courseOrProject: courseOrProject.trim(),
        description: description.trim() || 'Collaborative team workspace.',
        deadline: deadline || undefined,
        category,
      });
      onClose();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="modal-panel bg-white rounded-xl max-w-lg w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-5">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-brand text-white flex items-center justify-center">
              <Icons.group className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">{t.createGroup}</h2>
              <p className="hidden text-xs text-neutral-500 sm:block">
                {t.createGroupHint}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black p-1 rounded-lg"
          >
            <Icons.close className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {t.groupNameEn} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.groupNameEn}
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {t.groupNameKm}
            </label>
            <input
              type="text"
              value={nameKm}
              onChange={e => setNameKm(e.target.value)}
              placeholder="ឈ្មោះក្រុមជាភាសាខ្មែរ"
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black mb-1">
                {t.groupCode}
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder={t.placeholderAutoCode}
                className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40 font-mono uppercase placeholder:normal-case"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-1">
                {t.groupCategory}
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
              >
                <option value="assignment">School Assignment</option>
                <option value="research">Academic Research</option>
                <option value="startup">Project / Startup</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {t.courseOrProjectName} *
            </label>
            <input
              type="text"
              required
              value={courseOrProject}
              onChange={e => setCourseOrProject(e.target.value)}
              placeholder={t.courseOrProjectName}
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {t.taskDeadline}
            </label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {t.groupDescription}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t.placeholderGroupPurpose}
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
              {t.createGroup}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
