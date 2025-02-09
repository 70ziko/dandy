import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MenuScenePage from "game/pages/MenuScenePage";
import CardGame from "game";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuScenePage />} />
        <Route path="/game" element={<CardGame />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
