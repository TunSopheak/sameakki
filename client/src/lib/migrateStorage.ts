// The app used to be called LeaderSync. Copy the old settings to the new names once.
const RENAMED: [oldKey: string, newKey: string][] = [
  ['leadersync_language', 'sameakki_language'],
  ['leadersync-theme', 'sameakki-theme'],
  ['leadersync_active_group', 'sameakki_active_group'],
  ['leadersync_returning', 'sameakki_returning'],
  ['leadersync_tasks_view', 'sameakki_tasks_view'],
  ['leadersync-landing-settings', 'sameakki-landing-settings'],
];

try {
  for (const [oldKey, newKey] of RENAMED) {
    const value = localStorage.getItem(oldKey);
    if (value === null) continue;
    if (localStorage.getItem(newKey) === null) localStorage.setItem(newKey, value);
    localStorage.removeItem(oldKey);
  }
} catch {
  // Storage can be blocked
}

export {};
