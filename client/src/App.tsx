import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MenuScenePage from "game/pages/MenuScenePage";
import CardGame from "game/pages/CardGameScene";
import { GuestProvider, useGuest } from "./contexts/GuestContext";
import { api } from "./services/api";

// Component to handle guest ID synchronization with API
const GuestSync: React.FC = () => {
  const { guestId, setGuestId } = useGuest();

  useEffect(() => {
    // Update API service when guest ID changes
    api.setGuestId(guestId);

    // Listen for guest ID updates from API responses
    const handleGuestIdUpdate = (event: CustomEvent<string>) => {
      setGuestId(event.detail);
    };

    window.addEventListener('guestIdUpdated', handleGuestIdUpdate as EventListener);

    return () => {
      window.removeEventListener('guestIdUpdated', handleGuestIdUpdate as EventListener);
    };
  }, [guestId, setGuestId]);

  return null;
};

// Main app content wrapped with router
const AppContent: React.FC = () => {
  const { isLoading } = useGuest();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <GuestSync />
      <Routes>
        <Route path="/" element={<MenuScenePage />} />
        <Route path="/game" element={<CardGame />} />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <GuestProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </GuestProvider>
  );
};

export default App;
