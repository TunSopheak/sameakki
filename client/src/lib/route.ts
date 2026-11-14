import { useEffect, useState } from 'react';

/** The few addresses the app has. Clean paths (no "#"), so "/login" is what people see and share. */
export type Route = '/' | '/login' | '/about';

const KNOWN: Route[] = ['/', '/login', '/about'];
const CHANGE = 'leadersync:route';
const RETURNING_KEY = 'leadersync_returning';

/** Reads the address. An old "#login" link still works and becomes "/login". */
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

/** True when this browser has logged in before, so visitors who already have an account can skip the sales page. */
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
    // Without storage, the sales page simply shows every time
  }
}
