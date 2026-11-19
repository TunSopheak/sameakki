/** Tells the screen to celebrate. The CelebrationLayer listens and throws confetti. */
export type CelebrationKind = 'milestone' | 'approved' | 'welcome';

const EVENT = 'sameakki:celebrate';

export const celebrate = (kind: CelebrationKind) => {
  window.dispatchEvent(new CustomEvent<CelebrationKind>(EVENT, { detail: kind }));
};

export const onCelebrate = (handler: (kind: CelebrationKind) => void) => {
  const listener = (e: Event) => handler((e as CustomEvent<CelebrationKind>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
};
