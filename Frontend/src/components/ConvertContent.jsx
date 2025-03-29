import React from 'react';
import styles from '../styles/Content.module.css';

const ConvertContent = () => {
    return (
        <div className={styles.content}>
            <h2>How To Convert An Image</h2>
            <div className={styles.features}>
                <div className={styles.feature_image}>
                    <img src="/images/mine1.webp" alt="featuresImages" />
                </div>
                <div className={styles.feature_text}>
                    <ul>
                        <li>✅ Upload your image (jpeg, webp, png, gif)</li>
                        <li>✅ Choose the format to convert to</li>
                        <li>✅ Let the app convert your image</li>
                        <li>✅ Download your image</li>
                        <li>✅ 100% free image conversion - no watermarks or registration</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ConvertContent;