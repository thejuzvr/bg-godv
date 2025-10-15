'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type RealmContextValue = {
  realmId: string;
  setRealmId: (id: string) => void;
};

const RealmContext = createContext<RealmContextValue | undefined>(undefined);

export function RealmProvider({ children }: { children: React.ReactNode }) {
  const [realmId, setRealmIdState] = useState<string>('global');

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('realm_id') : null;
    if (stored) setRealmIdState(stored);
  }, []);

  const setRealmId = (id: string) => {
    setRealmIdState(id);
    try { window.localStorage.setItem('realm_id', id); } catch {}
  };

  const value = useMemo(() => ({ realmId, setRealmId }), [realmId]);
  return <RealmContext.Provider value={value}>{children}</RealmContext.Provider>;
}

export function useRealm(): RealmContextValue {
  const ctx = useContext(RealmContext);
  if (!ctx) throw new Error('useRealm must be used within a RealmProvider');
  return ctx;
}


