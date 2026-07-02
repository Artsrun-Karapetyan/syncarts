import { createContext, ReactNode, useContext } from "react";

import { useAppUpdate } from "@/components/update/useAppUpdate";

type AppUpdateContextValue = ReturnType<typeof useAppUpdate>;

const AppUpdateContext = createContext<AppUpdateContextValue | null>(null);

export function AppUpdateProvider({ children }: { children: ReactNode }) {
  const value = useAppUpdate();
  return (
    <AppUpdateContext.Provider value={value}>
      {children}
    </AppUpdateContext.Provider>
  );
}

export function useAppUpdateContext(): AppUpdateContextValue {
  const ctx = useContext(AppUpdateContext);
  if (!ctx) {
    throw new Error(
      "useAppUpdateContext must be used inside AppUpdateProvider",
    );
  }
  return ctx;
}
