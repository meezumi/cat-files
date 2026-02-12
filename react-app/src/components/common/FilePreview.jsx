import React, { useState, useEffect } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
import Modal from './Modal';
import Loader from './Loader';

const FilePreview = ({ fileId, fileName, folderId }) => {
    const [showPreview, setShowPreview] = useState(false);
    const [blobUrl, setBlobUrl] = useState(null);
    const [loadingBlob, setLoadingBlob] = useState(false);

    // Construct the download URL
    const downloadUrl = `/server/upload_function/${fileId}${folderId ? `?folderId=${folderId}` : ''}`;

    // Display filename if available, otherwise fall back to showing ID
    const displayName = fileName || `Document (ID: ${fileId})`;

    const getExtension = (name) => name ? name.split('.').pop().toLowerCase() : '';
    const ext = getExtension(fileName);

    // Logic to decide if we should pre-fetch as blob
    const useBlob = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'txt'].includes(ext);

    useEffect(() => {
        if (showPreview && useBlob && !blobUrl) {
            setLoadingBlob(true);
            fetch(downloadUrl)
                .then(res => {
                    if (!res.ok) throw new Error('Fetch failed');
                    return res.blob();
                })
                .then(blob => {
                    const url = URL.createObjectURL(blob);
                    setBlobUrl(url);
                })
                .catch(err => {
                    console.error("Failed to load preview blob", err);
                })
                .finally(() => setLoadingBlob(false));
        }
    }, [showPreview, useBlob, blobUrl, downloadUrl]);

    const handlePreview = (e) => {
        e.preventDefault();
        setShowPreview(true);
    };

    // Cleanup blob on unmount
    useEffect(() => {
        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [blobUrl]);

    // Config for DocViewer
    const docs = [
        {
            uri: blobUrl || downloadUrl,
            fileName: fileName,
            fileType: ext
        }
    ];

    const isSupported = [
        'bmp', 'csv', 'odt', 'doc', 'docx', 'gif', 'htm', 'html', 'jpg', 'jpeg', 'pdf', 'png', 'ppt', 'pptx', 'tiff', 'txt', 'webp', 'xls', 'xlsx'
    ].includes(ext);

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#666', marginTop: '8px' }}>
                <div style={{ width: 16, height: 16, background: '#eee', borderRadius: 2 }}></div>
                <span>{displayName}</span>

                {isSupported ? (
                    <button
                        onClick={handlePreview}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            color: 'inherit',
                            textDecoration: 'none',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            fontFamily: 'inherit',
                            fontSize: 'inherit'
                        }}
                    >
                        <ExternalLink size={14} style={{ marginLeft: 4 }} />
                        <span style={{ marginLeft: 4 }}>Preview</span>
                    </button>
                ) : (
                    <a href={downloadUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
                        <ExternalLink size={14} style={{ cursor: 'pointer', marginLeft: 4 }} />
                        <span style={{ marginLeft: 4 }}>View</span>
                    </a>
                )}

                <a href={downloadUrl} download style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
                    <Download size={14} style={{ cursor: 'pointer', marginLeft: 8 }} />
                </a>
            </div>

            <Modal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                title={`Preview: ${displayName}`}
                size="large"
                actions={
                    <a href={downloadUrl} download className="btn btn-primary">
                        <Download size={14} style={{ marginRight: 8 }} />
                        Download
                    </a>
                }
            >
                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '600px',
                    background: 'var(--color-bg-page)',
                    borderRadius: '0 0 8px 8px',
                    overflow: 'hidden', // Ensure overflow is hidden/scrolled
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {(loadingBlob && useBlob) ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Loader text="Loading document..." />
                        </div>
                    ) : (
                        <div id="doc-viewer-container" style={{ flex: 1, overflow: 'auto' }}>
                            <DocViewer
                                documents={docs}
                                pluginRenderers={DocViewerRenderers}
                                style={{ height: 'auto', minHeight: '100%' }} // Let it grow but contained
                                theme={{
                                    primary: "#10b981",
                                    secondary: "#ffffff",
                                    tertiary: "#e2e8f0",
                                    text_primary: "#1e293b",
                                    text_secondary: "#64748b",
                                    text_tertiary: "#94a3b8",
                                    disableThemeScrollbar: false,
                                }}
                                config={{
                                    header: { disableHeader: false, disableFileName: false, retainURLParams: true },
                                    loadingRenderer: {
                                        overrideComponent: () => (
                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                                <Loader text="Loading Preview..." />
                                            </div>
                                        )
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default FilePreview;
