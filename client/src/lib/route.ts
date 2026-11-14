import { useEffect, useState } from 'react';

/** Page addresses, without "#". */
export type Route = '/' | '/login' | '/about';

const KNOWN: Route[] = ['/', '/login', '/about'];
const CHANGE = 'leadersync:route';
const RETURNING_KEY = 'leadersync_returning';

export function currentRoute(): Route {
  if (window.location.hash === '#login') return '/login';
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return (KNOWN as string[]).includes(path) ? (path as Route) : '/';
}

export function navigate(route: Route, { replace = false }: { replace?: boolean } = {}) {
  if (replace) window.history.replaceState(null, '', route);
  else window.history.pushState(null, '', route);
  window.dispatchEvent(new Event(CHANGE));
}

export function useRoute(): Route {
  const [route, setRoute] = useState(currentRoute);
  useEffect(() => {
    const update = () => setRoute(currentRoute());
    window.addEventListener('popstate', update);
    window.addEventListener(CHANGE, update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener(CHANGE, update);
    };
  }, []);
  return route;
}

export function hasLoggedInBefore(): boolean {
  try {
    return localStorage.getItem(RETURNING_KEY) === '1';
  } catch {
    return false;
  }
}

export function rememberLogin() {
  try {
    localStorage.setItem(RETURNING_KEY, '1');
  } catch {
  }
}
