import type { BootstrapResponse } from "@/lib/app-state";
import { api, type PublicUser } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { user: nextUser } = await api.auth.me();
      setUser(nextUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth check failed");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const { user: nextUser } = await api.auth.login(email, password);
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setError(null);
    const { user: nextUser } = await api.auth.register(email, password);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
  }, []);

  return { user, loading, error, login, register, logout, refresh };
}

export function useBootstrap(enabled: boolean) {
  const [data, setData] = useState<BootstrapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const json = await api.bootstrap();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
