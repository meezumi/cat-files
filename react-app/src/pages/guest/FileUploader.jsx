import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import styles from './FileUploader.module.css';
import Modal from '../../components/common/Modal';

// Detect touch-primary devices
const isTouchDevice = () =>
    typeof window !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);

const FileUploader = ({ onUploadComplete, requestId, sectionId, itemId, allowedFileTypes }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const validateFile = useCallback((file) => {
        if (!allowedFileTypes || allowedFileTypes.trim() === '') return true;

        const validTypes = allowedFileTypes.split(',').map(t => t.trim().toLowerCase());
        const extension = '.' + file.name.split('.').pop().toLowerCase();

        const isValid = validTypes.some(type => {
            if (type.startsWith('.')) return type === extension;
            return file.type.match(new RegExp(type.replace('*', '.*')));
        });

        if (!isValid) {
            setError(`Invalid file type. Allowed: ${allowedFileTypes}`);
            return false;
        }
        return true;
    }, [allowedFileTypes]);

    const uploadFile = useCallback(async (file) => {
        setUploading(true);
        setProgress(10);

        try {
            const formData = new FormData();
            formData.append('file', file);

            if (requestId) formData.append('requestId', requestId);
            if (sectionId) formData.append('sectionId', sectionId);
            if (itemId) formData.append('itemId', itemId);

            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + 10;
                });
            }, 200);

            const response = await fetch('/server/upload_function/', {
                method: 'POST',
                body: formData
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

        } catch (err) {
            console.error('Upload failed:', err);
            setUploading(false);
            setProgress(0);
            setError('Upload failed: ' + err.message);
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
        if (files.length > 0 && validateFile(files[0])) {
            await uploadFile(files[0]);
        }
    }, [validateFile, uploadFile]);

    const handleFileSelect = async (e) => {
        if (e.target.files.length > 0 && validateFile(e.target.files[0])) {
            await uploadFile(e.target.files[0]);
        }
    };

    const triggerFileInput = () => document.getElementById(`fileInput-${itemId}`).click();

    if (uploading) {
        return (
            <div className={styles.uploadingState}>
                <div className={styles.progressLabel}>Uploading… {progress}%</div>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
            </div>
        );
    }

    const isTouch = isTouchDevice();
    const acceptAttr = allowedFileTypes || undefined;
    const primaryText = isDragging
        ? 'Drop file here'
        : isTouch
            ? 'Tap to select a file'
            : (allowedFileTypes ? `Upload ${allowedFileTypes}` : 'Drag & drop or click to upload');
    const hintText = allowedFileTypes
        ? `Allowed: ${allowedFileTypes}`
        : isTouch ? '' : 'or click anywhere above';

    return (
        <>
            <div
                className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && triggerFileInput()}
                aria-label="Upload file"
            >
                <input
                    type="file"
                    id={`fileInput-${itemId}`}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    accept={acceptAttr}
                />
                <UploadCloud size={isTouch ? 32 : 28} className={styles.icon} />
                <span className={styles.text}>{primaryText}</span>
                {hintText && <span className={styles.hint}>{hintText}</span>}
            </div>

            <Modal
                isOpen={!!error}
                onClose={() => setError(null)}
                title="Upload Error"
                actions={<button onClick={() => setError(null)} className={styles.modalCloseBtn}>OK</button>}
            >
                <p>{error}</p>
            </Modal>
        </>
    );
};

export default FileUploader;

