import React, { useState } from 'react';

const ImageCompressor = () => {
  const [preview, setPreview] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploadedPreview, setUploadedPreview] = useState(null);

  const [options, setOptions] = useState({
    quality: 85,
    lossless: false,
    optimize: true,
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
    <div className="compressor-container">
      <h1>Advanced Image Compressor</h1>

      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        {fileName && <p>Uploaded: {fileName}</p>}
      </div>

      {uploadedPreview && (
        <div className="uploaded-preview">
          <p>Preview:</p>
          <img src={uploadedPreview} alt="Uploaded Preview" />
        </div>
      )}

      <div className="controls-section">
        <div className="control-group">
          <label>Quality: {options.quality}%</label>
          <input
            type="range"
            min="1"
            max="100"
            value={options.quality}
            onChange={(e) => setOptions({...options, quality: e.target.value})}
          />
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={options.lossless}
              onChange={(e) => setOptions({...options, lossless: e.target.checked})}
            />
            Lossless Compression (WebP/PNG)
          </label>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={options.optimize}
              onChange={(e) => setOptions({...options, optimize: e.target.checked})}
            />
            Aggressive Optimization
          </label>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={options.progressive}
              onChange={(e) => setOptions({...options, progressive: e.target.checked})}
            />
            Progressive JPEG
          </label>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={options.dither}
              onChange={(e) => setOptions({...options, dither: e.target.checked})}
            />
            Dithering (PNG)
          </label>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={options.strip_metadata}
              onChange={(e) => setOptions({...options, strip_metadata: e.target.checked})}
            />
            Remove Metadata
          </label>
        </div>

        <div className="control-group">
          <label>JPEG Subsample:</label>
          <select
            value={options.subsampling}
            onChange={(e) => setOptions({...options, subsampling: e.target.value})}
          >
            <option value="0">Best (4:4:4)</option>
            <option value="1">Balanced (4:2:2)</option>
            <option value="2">Smallest (4:2:0)</option>
          </select>
        </div>
      </div>

      <button onClick={handleCompress} className="compress-btn" disabled={isLoading || !file}>
        {isLoading ? 'Compressing...' : 'Compress'}
      </button>

      {error && <div className="error">{error}</div>}

      {preview && !isLoading && (
        <div className="results-section">
          <div className="image-comparison">
            <img src={preview.image} alt="Compressed Preview" />
          </div>

          <div className="stats">
            <p>Original: {stats.original} KB</p>
            <p>Compressed: {stats.compressed} KB</p>
            <p>Reduction: {stats.ratio}%</p>
          </div>

          <button onClick={handleDownload} className="download-btn">
            Download Compressed Image
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageCompressor;