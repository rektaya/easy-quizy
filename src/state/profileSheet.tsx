import React, { createContext, useContext, useMemo, useState } from 'react';

// Whether the profile and settings screen is open. It opens over everything (from the avatar in Explore).
type Ctx = { open: boolean; show: () => void; hide: () => void };
const SheetContext = createContext<Ctx>({ open: false, show: () => {}, hide: () => {} });

export function ProfileSheetProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, show: () => setOpen(true), hide: () => setOpen(false) }), [open]);
  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}

export function useProfileSheet(): Ctx {
  return useContext(SheetContext);
}
