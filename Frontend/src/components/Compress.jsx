import React, { useState } from 'react';
import Content from './Content';
import styles from '../styles/Compress.module.css';

const ImageCompressor = () => {
  const [preview, setPreview] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploadedPreview, setUploadedPreview] = useState(null);

  const [options, setOptions] = useState({
    quality: 30,
    lossless: false,
    optimize: false,
    progressive: false,
    dither: false,
    strip_metadata: true,
    subsampling: "1"
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedPreview(event.target.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      const response = await fetch('http://localhost:5000/compress', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Compression failed');
      }

      const result = await response.json();

      setPreview({
        image: `data:image/jpeg;base64,${result.preview}`,
        download: result.download_url
      });

      setStats({
        original: (result.original_size / 1024).toFixed(2),
        compressed: (result.compressed_size / 1024).toFixed(2),
        ratio: ((result.compressed_size / result.original_size) * 100).toFixed(1)
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!preview?.download) return;

    const link = document.createElement('a');
    link.href = preview.download;
    link.download = `compressed.${preview.download.split(';')[0].split('/')[1]}`;

    // Add cleanup after download starts
    link.onclick = () => {
      setTimeout(() => {
        setFile(null);
        setFileName("");
        setUploadedPreview(null);
        setPreview(null);
        setStats(null);
        URL.revokeObjectURL(link.href);
      }, 100);
    };

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Advanced Image Compressor</h1>

      <div className={styles.fileInputContainer}>
        <input
          type="file"
          id="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isLoading}
          className={styles.fileInput}
        />
        <label htmlFor="file" className={styles.fileInputLabel}>
          Select Image
        </label>
        {fileName && <span className={styles.fileName}>Uploaded: {fileName}</span>}
      </div>

      <div className={styles.previewSection}>
        <div className={styles.imageContainer}>
          {uploadedPreview ? (
            <div className={styles.imageWrapper}>
              <img
                src={uploadedPreview}
                alt="Uploaded Preview"
                className={styles.previewImage}
              />
            </div>
          ) : (
            <div className={styles.imageWrapper}>
              <p>No image selected</p>
            </div>
          )}
        </div>

        {preview && !isLoading && (
          <div className={styles.imageContainer}>
            <p className={styles.imageContainerTitle}>Compressed Result</p>
            <div className={styles.compressedImageWrapper}>
              <img
                src={preview.image}
                alt="Compressed Preview"
                className={styles.previewImage}
              />
            </div>
            <div className={styles.stats}>
              <p>Original: {stats.original} KB</p>
              <p>Compressed: {stats.compressed} KB</p>
              <p>Reduction: {stats.ratio}%</p>
            </div>
          </div>
        )}
      </div>

      <div className={styles.controlsSection}>
        <div className={styles.controlGroup}>
          <label>Quality: {options.quality}%</label>
          <input
            type="range"
            min="1"
            max="100"
            value={options.quality}
            onChange={(e) => setOptions({...options, quality: e.target.value})}
          />
        </div>

        <div className={styles.controlGroup}>
          <label>
            <input
              type="checkbox"
              checked={options.lossless}
              onChange={(e) => setOptions({...options, lossless: e.target.checked})}
            />
            Lossless Compression (WebP/PNG)
          </label>
        </div>

        <div className={styles.controlGroup}>
          <label>
            <input
              type="checkbox"
              checked={options.optimize}
              onChange={(e) => setOptions({...options, optimize: e.target.checked})}
            />
            Aggressive Optimization
          </label>
        </div>

        <div className={styles.controlGroup}>
          <label>
            <input
              type="checkbox"
              checked={options.progressive}
              onChange={(e) => setOptions({...options, progressive: e.target.checked})}
            />
            Progressive JPEG
          </label>
        </div>

        <div className={styles.controlGroup}>
          <label>
            <input
              type="checkbox"
              checked={options.dither}
              onChange={(e) => setOptions({...options, dither: e.target.checked})}
            />
            Dithering (PNG)
          </label>
        </div>
      </div>

      <button
        onClick={handleCompress}
        className={styles.compressBtn}
        disabled={isLoading || !file}
      >
        {isLoading ? 'Compressing...' : 'Compress'}
      </button>

      {error && <div className={styles.error}>{error}</div>}

      {preview && !isLoading && (
        <button onClick={handleDownload} className={styles.downloadBtn}>
          Download Compressed Image
        </button>
      )}

      <Content />
    </div>
  );
};

export default ImageCompressor;