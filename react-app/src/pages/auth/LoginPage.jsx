import React from 'react';
import { FileText, Shield, Upload, CheckCircle } from 'lucide-react';
import styles from './LoginPage.module.css';

const LoginPage = () => {
    const handleLogin = () => {
        window.location.href = '/__catalyst/auth/login';
    };

    const handleSignup = () => {
        window.location.href = '/__catalyst/auth/signup';
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.branding}>
                    <FileText size={48} className={styles.logo} />
                    <h1>Cat-Files</h1>
                    <p className={styles.tagline}>Secure Document Collection Made Simple</p>
                </div>

                <div className={styles.features}>
                    <div className={styles.feature}>
                        <Shield size={24} />
                        <h3>Secure & Private</h3>
                        <p>End-to-end encrypted file transfers</p>
                    </div>
                    <div className={styles.feature}>
                        <Upload size={24} />
                        <h3>Easy Upload</h3>
                        <p>Simple drag-and-drop interface</p>
                    </div>
                    <div className={styles.feature}>
                        <CheckCircle size={24} />
                        <h3>Track Progress</h3>
                        <p>Monitor document collection in real-time</p>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button 
                        className={styles.loginBtn} 
                        onClick={handleLogin}
                    >
                        Log In
                    </button>
                    <button 
                        className={styles.signupBtn} 
                        onClick={handleSignup}
                    >
                        Sign Up
                    </button>
                </div>

                <p className={styles.footer}>
                    Powered by Zoho Catalyst
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
