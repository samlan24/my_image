import React, { useState, useRef } from 'react';
import axios from 'axios';
import styles from '../styles/Convert.module.css';
import { useNavigate } from 'react-router-dom';
import ConvertContent from './ConvertContent';

function Convert() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('png');
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [convertedImage, setConvertedImage] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsLoading(true);
    setError('');
    setConvertedImage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);

    try {
      const response = await axios.post('http://localhost:5000/convert', formData, {
        responseType: 'blob'
      });

      const imageUrl = URL.createObjectURL(response.data);
      setConvertedImage({
        url: imageUrl,
        format: format,
        name: `${file.name.split('.')[0]}.${format}`,
        blob: response.data
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Conversion failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!convertedImage) return;

    const link = document.createElement('a');
    link.href = convertedImage.url;
    link.download = convertedImage.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(convertedImage.url);
    setConvertedImage(null);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    setUploading(true);
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setConvertedImage(null);
    setTimeout(() => setUploading(false), 1000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.title_section}>
        <h1 className={styles.title}>Image Converter</h1>
        <p>Quickly convert images between JPG, PNG, and WEBP formats with our free online image converter</p>
      </div>
      <div className={styles.fileInputContainer}>
        <input
          type="file"
          id="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className={styles.fileInput}
          disabled={isLoading}
        />
        <label htmlFor="file" className={styles.fileInputLabel}>
          Select Image
        </label>
        {file && <span className={styles.fileName}>{file.name}</span>}
      </div>

      <div className={styles.previewSection}>
        <div className={styles.imageContainer}>
          {uploading ? (
            <div className={styles.loadingIndicator}>Uploading...</div>
          ) : file ? (
            <div className={styles.imageWrapper}>
              <img
                src={URL.createObjectURL(file)}
                alt="Original Preview"
                className={styles.previewImage}
              />
            </div>
          ) : (
            <div className={styles.imageWrapper}>
              <p>No image selected
              </p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Target Format:</label>
        <select
          value={format}
          onChange={(e) => {
            setFormat(e.target.value);
            setConvertedImage(null);
          }}
          disabled={isLoading}
        >
          <option value="png">PNG</option>
          <option value="jpg">JPG</option>
          <option value="webp">WebP</option>
          <option value="gif">GIF</option>
        </select>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className={styles.convertBtn}
        disabled={isLoading || !file}
      >
        {isLoading ? 'Converting...' : 'Convert'}
      </button>

      {error && <div className={styles.error}>{error}</div>}

      {convertedImage && (
        <div className={styles.resultSection}>
          <div className={styles.imageContainer}>
            <p className={styles.imageContainerTitle}>Converted Image ({format.toUpperCase()})</p>
            <div className={styles.imageWrapper}>
              <img
                src={convertedImage.url}
                alt="Converted preview"
                className={styles.previewImage}
              />
            </div>
          </div>
          <button
            onClick={handleDownload}
            className={styles.downloadBtn}
          >
            Download {convertedImage.format.toUpperCase()}
          </button>
        </div>
      )}

      <ConvertContent />
    </div>
  );
}

export default Convert;
