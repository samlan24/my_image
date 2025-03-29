import React, { useState } from 'react';

const YouTubeThumbnailDownloader = () => {
  const [url, setUrl] = useState('');
  const [thumbnails, setThumbnails] = useState({});
  const [videoId, setVideoId] = useState('');
  const [error, setError] = useState('');

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    setError('');
  };

  const isValidYouTubeUrl = (url) => {
    // Regular expression to validate YouTube URLs
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([0-9A-Za-z_-]{11})$/;
    return youtubeRegex.test(url);
  };

  const extractVideoId = (url) => {
    // Extract video ID using regex
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    return match ? match[1] : null;
  };

  const fetchThumbnails = () => {
    if (!isValidYouTubeUrl(url)) {
      setError('Invalid YouTube URL. Please enter a valid URL.');
      return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      setError('Could not extract video ID. Please check the URL.');
      return;
    }

    setVideoId(videoId);

    const thumbnailUrls = {
      maxresdefault: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      hqdefault: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      mqdefault: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      sddefault: `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
      default: `https://i.ytimg.com/vi/${videoId}/default.jpg`,
    };

    setThumbnails(thumbnailUrls);
  };

  const handleDownload = async (url, key) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `${videoId}_${key}.jpg`;
      downloadLink.style.display = 'none';
      downloadLink.target = "_blank";  // Ensures it doesn't just open the image
      downloadLink.rel = "noopener noreferrer"; // Security best practice

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink); // Clean up

      // Revoke object URL to free up memory
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);

      // Clear the state variables after download
      setUrl('');
      setThumbnails({});
      setVideoId('');
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
    }
  };
  return (
    <div>
      <h1>YouTube Thumbnail Downloader</h1>
      <input
        type="text"
        value={url}
        onChange={handleUrlChange}
        placeholder="Paste YouTube video URL here"
        style={{ width: '80%', padding: '10px' }}
      />
      <button onClick={fetchThumbnails}>Get Thumbnails</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {Object.keys(thumbnails).length > 0 && (
        <div>
          <h2>Available Thumbnails:</h2>
          {Object.keys(thumbnails).map((key) => (
            <div key={key} style={{ marginBottom: '20px' }}>
              <img
                src={thumbnails[key]}
                alt={key}
                style={{ maxWidth: '200px', border: '1px solid #ccc', borderRadius: '8px' }}
              />
              <button onClick={() => handleDownload(thumbnails[key], key)}>
                Download {key}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default YouTubeThumbnailDownloader;
