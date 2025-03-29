import React, { useState, useRef, useEffect } from "react";
import styles from "../styles/Resize.module.css";
import Content from "./Content";

const socialMediaPresets = {
    instagram_post: "Instagram Post (1080×1080)",
    instagram_story: "Instagram Story (1080×1920)",
    linkedin_post: "LinkedIn Post (1200×627)",
    twitter_post: "Twitter/X Post (1600×900)",
    facebook_post: "Facebook Post (1200×630)",
    youtube_thumbnail: "YouTube Thumbnail (1280×720)",
};

const Resize = () => {
    const [image, setImage] = useState(null);
    const [dimensions, setDimensions] = useState({ width: "", height: "" });
    const [originalAspect, setOriginalAspect] = useState(1);
    const [preset, setPreset] = useState("");
    const [previewUrl, setPreviewUrl] = useState(null);
    const [buttonState, setButtonState] = useState("resize");
    const [uploading, setUploading] = useState(false); // New state for uploading indicator
    const fileInputRef = useRef();

    useEffect(() => {
        if (!image) return;

        const img = new Image();
        img.onload = () => {
            setOriginalAspect(img.width / img.height);
        };
        img.src = URL.createObjectURL(image);
    }, [image]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploading(true); // Set uploading to true when file is selected
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setButtonState("resize");

            setTimeout(() => setUploading(false), 1000); // Reset uploading after 1 second
        }
    };

    const handlePresetChange = (e) => {
        const selectedPreset = e.target.value;
        setPreset(selectedPreset);

        if (selectedPreset) {
            const [width, height] = socialMediaPresets[selectedPreset].match(/\d+/g);
            setDimensions({ width, height });
        }
    };

    const handleDimensionChange = (e, dimension) => {
        const value = e.target.value;
        setDimensions(prev => ({
            ...prev,
            [dimension]: value
        }));
        setPreset(""); // Clear preset when custom dimensions are used
    };

    const handleResize = async () => {
        if (!image) return alert("Please upload an image.");

        setButtonState("downloading");

        const formData = new FormData();
        formData.append("file", image);

        if (preset) {
            formData.append("preset", preset);
        } else {
            formData.append("width", dimensions.width);
            formData.append("height", dimensions.height);
        }

        try {
            const response = await fetch("http://localhost:5000/resize", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `resized-image.${blob.type.split("/")[1]}`;
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setButtonState("resize");
            }, 100);
        } catch (error) {
            console.error("Error:", error);
            alert("Error resizing image: " + error.message);
            setButtonState("resize");
        }
    };

    const getButtonText = () => {
        switch (buttonState) {
            case "downloading": return "Processing...";
            case "download": return "Download Image";
            default: return "Resize Image";
        }
    };

    return (
        <div className={styles.resizeContainer}>
            <div className={styles.container}>
                <div className={styles.preview}>
                    {uploading ? (
                        <div className={styles.loadingIndicator}>Uploading...</div>
                    ) : previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className={styles.previewImage}
                        />
                    ) : (
                        <div className={styles.placeholder}>No image selected</div>
                    )}
                </div>

                <div className={styles.controls}>
                    <h1 className={styles.title}>Image Resizer</h1>

                    <div className={styles.uploadSection}>
                        <button
                            className={styles.uploadButton}
                            onClick={() => fileInputRef.current.click()}
                        >
                            {image ? "Change Image" : "Select Image"}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            style={{ display: "none" }}
                        />
                    </div>

                    <div className={styles.presetSection}>
                        <label className={styles.label}>Social Media Preset:</label>
                        <select
                            className={styles.select}
                            value={preset}
                            onChange={handlePresetChange}
                        >
                            <option value="">Custom Size</option>
                            {Object.keys(socialMediaPresets).map((key) => (
                                <option key={key} value={key}>{socialMediaPresets[key]}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.dimensionSection}>
                        <label className={styles.label}>Custom Dimensions:</label>
                        <div className={styles.dimensionInputs}>
                            <input
                                type="number"
                                className={styles.input}
                                placeholder="Width"
                                value={dimensions.width}
                                onChange={(e) => handleDimensionChange(e, "width")}
                                disabled={!!preset}
                            />
                            <span className={styles.dimensionSeparator}>×</span>
                            <input
                                type="number"
                                className={styles.input}
                                placeholder="Height"
                                value={dimensions.height}
                                onChange={(e) => handleDimensionChange(e, "height")}
                                disabled={!!preset}
                            />
                            <span className={styles.dimensionUnit}>px</span>
                        </div>
                    </div>

                    <button
                        className={`${styles.resizeButton} ${buttonState === "downloading" ? styles.processing : ""
                            }`}
                        onClick={handleResize}
                        disabled={buttonState === "downloading" || !image}
                    >
                        {getButtonText()}
                    </button>
                </div>

            </div>
            <div className={styles.contentSection}>
                <Content />
            </div>
        </div>
    );
};

export default Resize;
