import React, { useState } from 'react';
import styles from '../styles/Youtube.module.css';



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
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([0-9A-Za-z_-]{11})$/;
        return youtubeRegex.test(url);
    };

    const extractVideoId = (url) => {
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
            downloadLink.target = "_blank";
            downloadLink.rel = "noopener noreferrer";

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);


            setTimeout(() => {
                window.URL.revokeObjectURL(downloadUrl);
            }, 100);


            setUrl('');
            setThumbnails({});
            setVideoId('');
        } catch (error) {
            console.error('Error downloading image:', error);
            alert('Failed to download image. Please try again.');
        }
    };
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>YouTube Thumbnail Downloader</h1>
            <input
                className={styles.fileInput}
                type="text"
                value={url}
                onChange={handleUrlChange}
                placeholder="Paste YouTube video URL here"
            />
            <button className={styles.fileInputLabel} onClick={fetchThumbnails}>Get Thumbnails</button>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {Object.keys(thumbnails).length > 0 && (
                <div className={styles.thumbnailContainer}>
                    <h2>Available Thumbnails:</h2>
                    <div className={styles.thumbnailGrid}>
                        {Object.keys(thumbnails).map((key) => (
                            <div key={key} className={styles.thumbnailItem}>
                                <img
                                    src={thumbnails[key]}
                                    alt={key}
                                    className={styles.thumbnailImage}
                                />
                                <button
                                    className={styles.downloadButton}
                                    onClick={() => handleDownload(thumbnails[key], key)}
                                >
                                    Download {key}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};

export default YouTubeThumbnailDownloader;
