import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Convert from './components/Convert';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/convert" element={<Convert />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}

function Home() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Image Converter App</h1>
      <a href="/convert" style={{
        padding: '0.5rem 1rem',
        background: '#3498db',
        color: 'white',
        borderRadius: '4px',
        textDecoration: 'none'
      }}>
        Go to Converter
      </a>
    </div>
  );
}

export default App;