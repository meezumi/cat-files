import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

const Modal = ({ isOpen, onClose, title, children, actions, size = 'medium' }) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className={styles.overlay}>
            <div className={`${styles.modal} ${styles[size]}`}>
                <div className={styles.header}>
                    <h3>{title}</h3>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>
                <div className={styles.content}>
                    {children}
                </div>
                {actions && <div className={styles.actions}>{actions}</div>}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
