import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/Rotate.module.css'

const ImageRotator = () => {
    const [file, setFile] = useState(null);
    const [angle, setAngle] = useState(0);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [imgWidth, setImgWidth] = useState(0);
    const [imgHeight, setImgHeight] = useState(0);
    const fileInputRef = useRef(null);
    const downloadUrlRef = useRef(null); // Ref to track download URL
    const [uploading, setUploading] = useState(false); // New state for uploading indicator

    useEffect(() => {
        if (!file) return;

        const img = new Image();
        img.onload = () => {
            setImgWidth(img.width);
            setImgHeight(img.height);
        };
        img.src = previewUrl;
    }, [previewUrl]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Clean up previous file and preview if exists
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);

            setUploading(true); // Set uploading to true when file is selected
            setFile(selectedFile);
            setAngle(0);
            setError('');
            // Create preview URL
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setTimeout(() => setUploading(false), 1000); // Reset uploading after 1 second
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

    const calculateMaxDimensions = (width, height, angle) => {
        // Calculate new dimensions based on rotation
        const radians = (angle * Math.PI) / 180;
        const newWidth = Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians));
        const newHeight = Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians));

        // Adjust based on container size
        const containerWidth = 400; // Example width
        const containerHeight = 400; // Example height

        const scale = Math.min(containerWidth / newWidth, containerHeight / newHeight);

        return {
            width: newWidth * scale,
            height: newHeight * scale,
        };
    };

    const imgDimensions = calculateMaxDimensions(imgWidth, imgHeight, angle);

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
        <div className={styles.container}>
            <h2 className={styles.title}>Image Rotator</h2>

            <div className={styles.fileInputContainer}>
                <input
                    type="file"
                    id="file"
                    ref={fileInputRef}
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                />
                <label htmlFor="file" className={styles.fileInputLabel}>
                    Select Image
                </label>
                {file && <span className={styles.fileName}>{file.name}</span>}
            </div>

            <div className={styles.previewContainer}>
                {uploading ? (
                    <div className={styles.loadingIndicator}>Uploading...</div>
                ) : previewUrl ? (
                    <>
                        <div className={styles.imageWrapper}>
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className={styles.previewImage}
                                style={{
                                    transform: `rotate(${angle}deg)`,
                                    width: imgDimensions.width,
                                    height: imgDimensions.height,
                                    objectFit: 'contain',
                                }}
                            />
                        </div>
                        <div className={styles.rotationControls}>
                            <button
                                onClick={rotateLeft}
                                disabled={!file}
                                className={styles.rotationButton}
                            >
                                ↺ Left (-90°)
                            </button>
                            <span className={styles.angleDisplay}>Current Angle: {angle}°</span>
                            <button
                                onClick={rotateRight}
                                disabled={!file}
                                className={styles.rotationButton}
                            >
                                ↻ Right (+90°)
                            </button>
                        </div>
                    </>
                ) : (
                    <div className={styles.previewPlaceholder}>
                        Select an image to preview
                    </div>
                )}
            </div>

            <button
                onClick={handleDownload}
                disabled={isLoading || !file}
                className={styles.downloadBtn}
            >
                {isLoading ? 'Processing...' : 'Download Rotated Image'}
            </button>

            {error && <div className={styles.error}>{error}</div>}
        </div>
    );
};

export default ImageRotator;
