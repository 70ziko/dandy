import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

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
    const initializeGuest = async () => {
      try {
        const storedGuestId = localStorage.getItem(GUEST_ID_KEY);
        
        if (storedGuestId) {
          setGuestId(storedGuestId);
          api.setGuestId(storedGuestId);
        } else {
          const newGuestId = await api.getGuestId();
          updateGuestId(newGuestId);
        }
      } catch (error) {
        console.error('Failed to initialize guest:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeGuest();

    const handleGuestIdUpdate = (event: CustomEvent<string>) => {
      updateGuestId(event.detail);
    };

    window.addEventListener('guestIdUpdated', handleGuestIdUpdate as EventListener);
    return () => {
      window.removeEventListener('guestIdUpdated', handleGuestIdUpdate as EventListener);
    };
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
