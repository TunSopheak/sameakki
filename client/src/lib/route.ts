import { useEffect, useState } from 'react';

/** Pages of the app. The address bar always shows "/", the page is kept in the history entry. */
export type Route = '/' | '/login' | '/about';

const KNOWN: Route[] = ['/', '/login', '/about'];
const CHANGE = 'leadersync:route';
const RETURNING_KEY = 'leadersync_returning';

const isRoute = (value: unknown): value is Route => (KNOWN as unknown[]).includes(value);

export function currentRoute(): Route {
  if (isRoute(window.history.state?.route)) return window.history.state.route;
  // Old links such as /login or #login still work
  if (window.location.hash === '#login') return '/login';
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return isRoute(path) ? path : '/';
}

export function navigate(route: Route, { replace = false }: { replace?: boolean } = {}) {
  const state = { route };
  if (replace) window.history.replaceState(state, '', '/');
  else window.history.pushState(state, '', '/');
  window.dispatchEvent(new Event(CHANGE));
}

export function useRoute(): Route {
  const [route, setRoute] = useState(currentRoute);
  useEffect(() => {
    if (window.location.pathname !== '/' || window.location.hash) navigate(currentRoute(), { replace: true });
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
