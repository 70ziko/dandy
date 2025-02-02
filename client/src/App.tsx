import React from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import FluidBackground from "./components/fluidBackground/FluidBackground";

const ScenePage: React.FC = () => {
  const { tableId } = useParams<{ tableId?: string }>();
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <FluidBackground />
      <div style={{ position: "absolute", top: 20, left: 20 }}>
        <button style={{ marginRight: "10px" }}>Private Rooms</button>
        <button disabled>Matchmaking</button>
      </div>
      {tableId && (
        <div style={{ position: "absolute", bottom: 20, left: 20, color: "#fff" }}>
          <p>Table ID: {tableId}</p>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ScenePage />} />
        <Route path="/:tableId" element={<ScenePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
