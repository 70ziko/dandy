import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FluidBackground from "components/fluidBackground/FluidBackground";
import CardGame from "game";

const ScenePage: React.FC = () => {
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <FluidBackground />
      <div style={{ position: "absolute", top: 20, left: 20 }}>
        <button style={{ marginRight: "10px" }}>Private Rooms</button>
        <button disabled>Matchmaking</button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ScenePage />} />
        <Route path="/game" element={<CardGame />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
