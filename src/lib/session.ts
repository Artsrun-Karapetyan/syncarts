import { useEffect, useState } from "react";

const AUTH_USER_KEY = "syncarts_auth_user";
const AUTH_SESSION_CHANGED_EVENT = "syncarts:auth-session-changed";

export type StoredAuthUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
};

export function getStoredUser() {
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  return raw ? (JSON.parse(raw) as StoredAuthUser) : null;
}

export function setStoredUser(user: StoredAuthUser) {
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

export function clearStoredUser() {
  window.localStorage.removeItem(AUTH_USER_KEY);
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

export function useStoredUser() {
  const [user, setUser] = useState<StoredAuthUser | null>(null);

  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    sync();

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, sync);
  }, []);

  return user;
}
