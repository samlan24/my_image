import React, { useState, useRef } from 'react';
import axios from 'axios';
import styles from '../styles/Convert.module.css';
import { useNavigate } from 'react-router-dom';
import Content from './Content';

function Convert() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('png');
  const [isLoading, setIsLoading] = useState(false);
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

    // Cleanup
    URL.revokeObjectURL(convertedImage.url);
    setConvertedImage(null);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the file input
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setConvertedImage(null);
  };

  return (
    <div className={styles.convert_container}>
      <h1>Image Converter</h1>

      <form onSubmit={handleSubmit}>
        <div className={styles.form_group}>
          <label>Select Image:</label>
          <input
            type="file"
            ref={fileInputRef} // Attach the ref
            onChange={handleFileChange}
            accept="image/*"
            required
          />
        </div>

        <div className={styles.form_group}>
          <label>Target Format:</label>
          <select
            value={format}
            onChange={(e) => {
              setFormat(e.target.value);
              setConvertedImage(null);
            }}
          >
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
            <option value="webp">WebP</option>
            <option value="gif">GIF</option>
          </select>
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Converting...' : 'Convert'}
        </button>
      </form>

      {error && <div className={styles.error_message}>{error}</div>}

      {convertedImage && (
        <div className={styles.result_section}>
          <h2>Converted Image</h2>
          <img src={convertedImage.url} alt="Converted preview" />
          <button
            onClick={handleDownload}
            className={styles.download_button}
          >
            Download {convertedImage.format.toUpperCase()}
          </button>
        </div>
      )}
      <Content />
    </div>
  );
}

export default Convert;