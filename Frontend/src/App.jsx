import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Convert from './components/Convert';
import Desktop_Nav from './components/Desktop_Nav';
import ImageCropper from './components/ImageCropper';
import ImageCompressor from './components/Compress';
import ImageRotator from './components/Rotate';
import Resize from './components/Resize';
import YouTubeThumbnailDownloader from './components/Youtube';



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
            <Route path="/resize" element={<Resize />} />
            <Route path="/youtube" element={<YouTubeThumbnailDownloader />} />
          </Routes>
        </div>
      </Router>

    </div>

  );
}

export default App;