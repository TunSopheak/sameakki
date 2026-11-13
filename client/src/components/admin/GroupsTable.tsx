import React, { useMemo, useState } from 'react';
import type { AdminGroupRow } from '@shared/types';
import { formatDateTime } from '../../lib/dates';
import { useTableView } from '../../lib/useTableView';
import { useApp } from '../../context/AppContext';
import { FilterSelect, Pager, RowAction, SearchBox, SortHeader } from './TableParts';

interface GroupsTableProps {
  groups: AdminGroupRow[];
  onDelete: (group: AdminGroupRow, active: boolean) => void;
}

export const GroupsTable: React.FC<GroupsTableProps> = ({ groups, onDelete }) => {
  const { t, language } = useApp();
  const [status, setStatus] = useState<'active' | 'deleted'>('active');
  const deletedCount = groups.filter(g => !g.isActive).length;

  const filtered = useMemo(() => groups.filter(g => g.isActive === (status === 'active')), [groups, status]);

  const view = useTableView(filtered, {
    searchText: g => `${g.name} ${g.nameKm ?? ''} ${g.code} ${g.leaderName ?? ''}`,
    compare: {
      name: (a, b) => a.name.localeCompare(b.name),
      code: (a, b) => a.code.localeCompare(b.code),
      leader: (a, b) => (a.leaderName ?? '').localeCompare(b.leaderName ?? ''),
      members: (a, b) => a.memberCount - b.memberCount,
      tasks: (a, b) => a.taskCount - b.taskCount,
      created: (a, b) => a.createdAt.localeCompare(b.createdAt),
    },
    initialSort: { key: 'created', dir: 'desc' },
  });

  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs">
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 px-4 py-3">
        <h3 className="mr-auto text-sm font-bold text-black">
          {t.adminGroups} ({view.total})
        </h3>
        <SearchBox value={view.query} onChange={view.setQuery} placeholder={t.adminSearchGroups} />
        <FilterSelect
          value={status}
          onChange={v => setStatus(v as 'active' | 'deleted')}
          options={[
            { value: 'active', label: t.adminAllStatus },
            { value: 'deleted', label: `${t.adminDeleted} (${deletedCount})` },
          ]}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-xs">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <SortHeader label={t.adminGroupName} column="name" sort={view.sort} onSort={view.toggleSort} />
              <SortHeader label={t.groupCode} column="code" sort={view.sort} onSort={view.toggleSort} />
              <SortHeader label={t.adminCreatedBy} column="leader" sort={view.sort} onSort={view.toggleSort} />
              <SortHeader label={t.adminMembers} column="members" sort={view.sort} onSort={view.toggleSort} />
              <SortHeader label={t.adminTasks} column="tasks" sort={view.sort} onSort={view.toggleSort} />
              <SortHeader label={t.adminJoined} column="created" sort={view.sort} onSort={view.toggleSort} />
              <th className="px-4 py-2.5 text-right font-semibold">{t.adminActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {view.pageRows.map(group => (
              <tr key={group.id} className={`hover:bg-neutral-50 ${group.isActive ? '' : 'opacity-60'}`}>
                <td className="px-4 py-3 font-semibold text-black">{language === 'km' && group.nameKm ? group.nameKm : group.name}</td>
                <td className="px-4 py-3 font-mono text-neutral-700">{group.code}</td>
                <td className="px-4 py-3 text-neutral-700">{group.leaderName ?? '-'}</td>
                <td className="px-4 py-3 text-neutral-700">{group.memberCount}</td>
                <td className="px-4 py-3 text-neutral-700">{group.taskCount}</td>
                <td className="px-4 py-3 text-neutral-500">{formatDateTime(group.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <RowAction
                    active={group.isActive}
                    onClick={() => onDelete(group, !group.isActive)}
                    deleteLabel={t.adminDelete}
                    restoreLabel={t.adminRestore}
                  />
                </td>
              </tr>
            ))}
            {view.pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  {t.adminNoResults}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pager page={view.page} pageCount={view.pageCount} total={view.total} onPage={view.setPage} />
    </section>
  );
};
