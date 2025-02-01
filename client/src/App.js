import React from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';

function ScenePage() {
  // Retrieve tableId from the URL if present
  const { tableId } = useParams();

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>    
    
    <canvas id="canvas"></canvas>
    
    <div id="threejs-scene" style={{ width: '100%', height: '100%', background: '#000', color: '#fff' }}>
        {/* Placeholder for three.js background scene */}
    </div>
      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <button style={{ marginRight: '10px' }}>Private Rooms</button>
        <button disabled>Matchmaking</button>
      </div>
      {tableId && (
        <div style={{ position: 'absolute', bottom: 20, left: 20, color: '#fff' }}>
          <p>Table ID: {tableId}</p>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ScenePage />} />
        <Route path="/:tableId" element={<ScenePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
