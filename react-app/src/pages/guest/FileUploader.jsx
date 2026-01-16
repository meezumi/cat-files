import React, { useCallback, useState } from 'react';
import { UploadCloud, File, X, Check } from 'lucide-react';
import styles from './FileUploader.module.css';

const FileUploader = ({ onUploadComplete, requestId, sectionId, itemId }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            await uploadFile(files[0]);
        }
    }, [requestId, sectionId, itemId]);

    const handleFileSelect = async (e) => {
        if (e.target.files.length > 0) {
            await uploadFile(e.target.files[0]);
        }
    };

    const uploadFile = async (file) => {
        setUploading(true);
        setProgress(10);

        try {
            // Real FormData for file upload
            const formData = new FormData();
            formData.append('file', file);

            // Add Context Data
            if (requestId) formData.append('requestId', requestId);
            if (sectionId) formData.append('sectionId', sectionId);
            if (itemId) formData.append('itemId', itemId);

            // Simulate progress
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + 10;
                });
            }, 200);

            // Use fetch with FormData (Advanced IO handles multipart)
            const response = await fetch('/server/upload_function/', {
                method: 'POST',
                body: formData
                // Note: Do NOT set Content-Type header manually for FormData, 
                // browser sets it with boundary.
            });

            clearInterval(interval);
            setProgress(100);

            const result = await response.json();

            if (result.status === 'success') {
                setTimeout(() => {
                    setUploading(false);
                    if (onUploadComplete) onUploadComplete(result.data);
                }, 500);
            } else {
                throw new Error(result.message || 'Upload failed');
            }

        } catch (error) {
            console.error('Upload failed:', error);
            setUploading(false);
            alert('Upload failed: ' + error.message);
        }
    };

    if (uploading) {
        return (
            <div className={styles.uploadingState}>
                <div className={styles.progressLabel}>Uploading... {progress}%</div>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
        >
            <input
                type="file"
                id="fileInput"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
            />
            <UploadCloud size={24} className={styles.icon} />
            <span className={styles.text}>
                {isDragging ? 'Drop file here' : 'Drag & drop or Click to Upload'}
            </span>
        </div>
    );
};

export default FileUploader;
