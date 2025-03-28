import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Convert from './components/Convert';
import Desktop_Nav from './components/Desktop_Nav';
import ImageCropper from './components/ImageCropper';
import ImageCompressor from './components/Compress';
import ImageRotator from './components/Rotate';

function App() {
  return (
    <div className='main_container'>
      <Router>
        <Desktop_Nav />
        <div className='content'>
          <Routes>
            <Route path="/convert" element={<Convert />} />
            <Route path="/crop" element={<ImageCropper />} />
            <Route path="/compress" element={<ImageCompressor />} />
            <Route path="/rotate" element={<ImageRotator />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </Router>

    </div>

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