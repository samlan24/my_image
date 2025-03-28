import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Content from './Content';

const ImageRotator = () => {
  const [file, setFile] = useState(null);
  const [angle, setAngle] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const downloadUrlRef = useRef(null); // Ref to track download URL

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Clean up previous file and preview if exists
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);

      setFile(selectedFile);
      setAngle(0);
      setError('');
      // Create preview URL
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const rotateLeft = () => {
    const newAngle = (angle - 90) % 360;
    setAngle(newAngle);
    updatePreview(newAngle);
  };

  const rotateRight = () => {
    const newAngle = (angle + 90) % 360;
    setAngle(newAngle);
    updatePreview(newAngle);
  };

  const updatePreview = async (newAngle) => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('angle', newAngle.toString());

      const response = await axios.post('http://localhost:5000/preview', formData, {
        responseType: 'blob',
      });

      // Clean up previous preview URL
      if (previewUrl) URL.revokeObjectURL(previewUrl);

      const previewBlob = new Blob([response.data], { type: 'image/jpeg' });
      setPreviewUrl(URL.createObjectURL(previewBlob));
    } catch (err) {
      console.error('Preview update failed:', err);
    }
  };

  const handleDownload = async () => {
    if (!file) {
      setError('Please select an image file');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('angle', angle.toString());

      const response = await axios.post('http://localhost:5000/rotate', formData, {
        responseType: 'blob',
      });

      // Clean up any previous download URL
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);

      // Create new download URL
      const url = window.URL.createObjectURL(new Blob([response.data]));
      downloadUrlRef.current = url;

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rotated_${angle}_${file.name}`);
      document.body.appendChild(link);
      link.click();

      // Clean up after download
      setTimeout(() => {
        document.body.removeChild(link);
        if (downloadUrlRef.current) {
          URL.revokeObjectURL(downloadUrlRef.current);
          downloadUrlRef.current = null;
        }
      }, 100);

      // Reset file state
      setFile(null);
      setAngle(0);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear file input
      }
    } catch (err) {
      if (err.response && err.response.data) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            setError(errorData.error || 'An error occurred');
          } catch (e) {
            setError('An error occurred while processing the image');
          }
        };
        reader.readAsText(err.response.data);
      } else {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      // Clean up all object URLs when component unmounts
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    };
  }, [previewUrl]);

  return (
    <div className="image-rotator">
      <h2>Image Rotator</h2>

      <div className="file-input">
        <input
          type="file"
          id="file"
          ref={fileInputRef}
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button onClick={() => fileInputRef.current?.click()}>
          Select Image
        </button>
        {file && <span>{file.name}</span>}
      </div>

      {previewUrl && (
        <div className="preview-container">
          <div className="image-wrapper">
            <img
              src={previewUrl}
              alt="Preview"
              style={{ transform: `rotate(${angle}deg)` }}
            />
          </div>
          <div className="rotation-controls">
            <button onClick={rotateLeft} disabled={!file}>
              ↺ Left (-90°)
            </button>
            <span>Current Angle: {angle}°</span>
            <button onClick={rotateRight} disabled={!file}>
              ↻ Right (+90°)
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleDownload}
        disabled={isLoading || !file}
        className="download-btn"
      >
        {isLoading ? 'Processing...' : 'Download Rotated Image'}
      </button>

      {error && <div className="error">{error}</div>}
      <Content />
    </div>
  );
};

export default ImageRotator;