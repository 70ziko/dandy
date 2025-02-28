import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MenuScenePage from "./pages/MenuScenePage";
import CardGame from "./pages/CardGameScene";
import { GuestProvider, useGuest } from "./contexts/GuestContext";
import { api } from "./services/api";

const GuestSync: React.FC = () => {
  const { guestId, setGuestId } = useGuest();

  useEffect(() => {
    api.setGuestId(guestId);

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
        <Route path="/game/:tableId" element={<CardGame />} />
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
