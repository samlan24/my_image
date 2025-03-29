import React, { useRef, useState, useEffect } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.min.css';
import styles from '../styles/ImageCropper.module.css';
import Content from './Content';

const ImageCropper = () => {
  const [image, setImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  });
  const [uploading, setUploading] = useState(false); // New state for uploading indicator
  const cropperRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setError('Please select an image file');
      return;
    }

    setUploading(true); // Set uploading to true when file is selected

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setCroppedImage(null);
      setError(null);
      setTimeout(() => setUploading(false), 1000); // Reset uploading after 1 second
    };
    reader.readAsDataURL(file);
  };

  const handleCropMove = () => {
    if (cropperRef.current?.cropper) {
      const data = cropperRef.current.cropper.getData();
      setCropData({
        x: Math.round(data.x),
        y: Math.round(data.y),
        width: Math.round(data.width),
        height: Math.round(data.height)
      });
    }
  };

  const getCropData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const cropper = cropperRef.current?.cropper;
      if (!cropper) {
        throw new Error('Cropper not initialized');
      }

      const cropData = cropper.getData();

      const formData = new FormData();
      formData.append('file', fileInputRef.current.files[0]);
      formData.append('crop', `${cropData.x},${cropData.y},${cropData.width},${cropData.height}`);

      const response = await fetch('http://localhost:5000/crop', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Cropping failed');
      }

      const blob = await response.blob();
      setCroppedImage(URL.createObjectURL(blob));
    } catch (err) {
      setError(err.message);
      console.error('Cropping error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!croppedImage) return;

    const a = document.createElement('a');
    a.href = croppedImage;
    a.download = `cropped_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up after download
    cleanup();
  };

  const cleanup = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setImage(null);
    setCroppedImage(null);
    setCropData({ x: 0, y: 0, width: 0, height: 0 });
    if (croppedImage) {
      URL.revokeObjectURL(croppedImage);
    }
    if (cropperRef.current?.cropper) {
      cropperRef.current.cropper.destroy();
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Image Cropper</h1>

      <div className={styles.fileInputContainer}>
        <input
          type="file"
          id="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          className={styles.fileInput}
        />
        <label htmlFor="file" className={styles.fileInputLabel}>
          Select Image
        </label>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.cropperWrapper}>
        {uploading ? (
          <div className={styles.loadingIndicator}>Uploading...</div>
        ) : image ? (
          <Cropper
            src={image}
            className={styles.cropper}
            initialAspectRatio={1}
            guides={true}
            ref={cropperRef}
            viewMode={1}
            dragMode="move"
            scalable={true}
            cropBoxMovable={true}
            cropBoxResizable={true}
            background={false}
            responsive={true}
            autoCropArea={0.8}
            checkOrientation={false}
            crop={handleCropMove}
            cropmove={handleCropMove}
          />
        ) : (
          <div className={styles.previewPlaceholder}>
            Select an image to begin cropping
          </div>
        )}
      </div>

      <div className={styles.coordinatesContainer}>
        <div className={styles.coordinateBox}>
          <span className={styles.coordinateLabel}>X:</span>
          <span className={styles.coordinateValue}>{cropData.x}px</span>
        </div>
        <div className={styles.coordinateBox}>
          <span className={styles.coordinateLabel}>Y:</span>
          <span className={styles.coordinateValue}>{cropData.y}px</span>
        </div>
        <div className={styles.coordinateBox}>
          <span className={styles.coordinateLabel}>Width:</span>
          <span className={styles.coordinateValue}>{cropData.width}px</span>
        </div>
        <div className={styles.coordinateBox}>
          <span className={styles.coordinateLabel}>Height:</span>
          <span className={styles.coordinateValue}>{cropData.height}px</span>
        </div>
      </div>

      {croppedImage && (
        <div className={styles.previewContainer}>
          <h3 className={styles.previewTitle}>Cropped Preview</h3>
          <img
            src={croppedImage}
            alt="Cropped"
            className={styles.previewImage}
          />
        </div>
      )}

      <div className={styles.buttonGroup}>
        <button
          onClick={getCropData}
          disabled={!image || isLoading}
          className={`${styles.button} ${styles.buttonPrimary} ${(!image || isLoading) ? styles.buttonDisabled : ''}`}
        >
          {isLoading ? 'Processing...' : 'Crop Image'}
        </button>

        <button
          onClick={handleDownload}
          disabled={!croppedImage}
          className={`${styles.button} ${styles.buttonSuccess} ${!croppedImage ? styles.buttonDisabled : ''}`}
        >
          Download
        </button>
      </div>
      <Content />
    </div>
  );
};

export default ImageCropper;
