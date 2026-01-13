import React, { useCallback, useState } from 'react';
import { UploadCloud, File, X, Check } from 'lucide-react';
import styles from './FileUploader.module.css';

const FileUploader = ({ onUploadComplete }) => {
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
    }, []);

    const handleFileSelect = async (e) => {
        if (e.target.files.length > 0) {
            await uploadFile(e.target.files[0]);
        }
    };

    const uploadFile = async (file) => {
        setUploading(true);
        setProgress(10);

        try {
            // Mock Upload to backend
            // In real app: FormData with file
            const formData = new FormData();
            formData.append('file', file);

            // Simulate progress
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + 10;
                });
            }, 200);

            const response = await fetch('/server/upload_function/', {
                method: 'POST',
                body: JSON.stringify({ filename: file.name, size: file.size }) // Mock body for now as Advanced IO handles multipart differently or we use SDK
            });

            clearInterval(interval);
            setProgress(100);

            const result = await response.json();

            setTimeout(() => {
                setUploading(false);
                if (onUploadComplete) onUploadComplete(result.data);
            }, 500);

        } catch (error) {
            console.error('Upload failed:', error);
            setUploading(false);
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
