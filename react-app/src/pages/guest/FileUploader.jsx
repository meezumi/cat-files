import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import styles from './FileUploader.module.css';

const FileUploader = ({ onUploadComplete, requestId, sectionId, itemId, allowedFileTypes }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const validateFile = useCallback((file) => {
        if (!allowedFileTypes || allowedFileTypes.trim() === '') return true;

        const validTypes = allowedFileTypes.split(',').map(t => t.trim().toLowerCase());
        // Extract extension with dot
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        // Check against extension (e.g. .pdf) or mime type (e.g. application/pdf)
        const isValid = validTypes.some(type => {
            if (type.startsWith('.')) return type === extension;
            return file.type.match(new RegExp(type.replace('*', '.*'))); // Simple mime match
        });

        if (!isValid) {
            alert(`Invalid file type. Allowed types: ${allowedFileTypes}`);
            return false;
        }
        return true;
    }, [allowedFileTypes]);

    const uploadFile = useCallback(async (file) => {
        setUploading(true);
        // ... (rest of upload logic) ...
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
    }, [requestId, sectionId, itemId, onUploadComplete]);

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
            if (validateFile(files[0])) {
                await uploadFile(files[0]);
            }
        }
    }, [validateFile, uploadFile]);

    const handleFileSelect = async (e) => {
        if (e.target.files.length > 0) {
            if (validateFile(e.target.files[0])) {
                await uploadFile(e.target.files[0]);
            }
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

    // Prepare accept attribute for file input
    const acceptAttr = allowedFileTypes ? allowedFileTypes : undefined;

    return (
        <div
            className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById(`fileInput-${itemId}`).click()}
        >
            <input
                type="file"
                id={`fileInput-${itemId}`}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept={acceptAttr}
            />
            <UploadCloud size={24} className={styles.icon} />
            <span className={styles.text}>
                {isDragging ? 'Drop file here' : (allowedFileTypes ? `Upload ${allowedFileTypes}` : 'Drag & drop or Click to Upload')}
            </span>
        </div>
    );
};

export default FileUploader;
