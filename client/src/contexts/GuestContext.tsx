import React, { createContext, useContext, useState, useEffect } from 'react';

interface GuestContextType {
  guestId: string | null;
  setGuestId: (id: string) => void;
  isLoading: boolean;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

const GUEST_ID_KEY = 'dandy_guest_id';

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedGuestId = localStorage.getItem(GUEST_ID_KEY);
    if (storedGuestId) {
      setGuestId(storedGuestId);
    } 
    setIsLoading(false);
  }, []);

  const updateGuestId = (id: string) => {
    setGuestId(id);
    localStorage.setItem(GUEST_ID_KEY, id);
  };

  return (
    <GuestContext.Provider
      value={{
        guestId,
        setGuestId: updateGuestId,
        isLoading
      }}
    >
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest() {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error('useGuest must be used within a GuestProvider');
  }
  return context;
}
