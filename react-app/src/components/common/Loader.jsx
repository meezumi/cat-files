import React from 'react';
import { Loader2 } from 'lucide-react';
import styles from './Loader.module.css';

const Loader = ({ text = "Loading..." }) => {
    return (
        <div className={styles.container}>
            <Loader2 className={styles.spinner} size={32} />
            {text && <span className={styles.text}>{text}</span>}
        </div>
    );
};

export default Loader;
