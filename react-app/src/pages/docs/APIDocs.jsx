import React, { useState } from 'react';
import { Book, Copy } from 'lucide-react';
import styles from './APIDocs.module.css';

const endpoints = [
    {
        category: "Authentication",
        items: [
            { name: "Get Current User", method: "GET", path: "/server/auth_function/me", desc: "Retrieve currently logged-in user details." },
            { name: "Logout", method: "GET", path: "/server/auth_function/logout", desc: "Sign out the current user." }
        ]
    },
    {
        category: "Requests",
        items: [
            { name: "List Requests", method: "GET", path: "/server/fetch_requests_function/?page=1&per_page=10", desc: "Fetch paginated list of requests." },
            { name: "Get Request", method: "GET", path: "/server/fetch_requests_function/:id", desc: "Get full details of a specific request." },
            { name: "Create Request", method: "POST", path: "/server/create_request_function/", desc: "Create a new Data Collection Request." }
        ]
    },
    {
        category: "Files",
        items: [
            { name: "Upload File", method: "POST", path: "/server/upload_function/", desc: "Upload a file to a specific Item." },
            { name: "Download File", method: "GET", path: "/server/upload_function/:id", desc: "Download a specific file." }
        ]
    },
    {
        category: "Organisations",
        items: [
            { name: "List Orgs", method: "GET", path: "/server/org_function/", desc: "List organisations related to the user." },
            { name: "Get Org Contacts", method: "GET", path: "/server/org_function/:id/contacts", desc: "List contacts within an organisation." }
        ]
    }
];

const APIDocs = () => {
    const [activeCategory, setActiveCategory] = useState(endpoints[0].category);
    const [activeEndpoint, setActiveEndpoint] = useState(endpoints[0].items[0]);

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Book size={24} color="var(--color-primary)" />
                    <h2>API Reference</h2>
                </div>
                <nav className={styles.nav}>
                    {endpoints.map(cat => (
                        <div key={cat.category} className={styles.category}>
                            <h3 onClick={() => setActiveCategory(cat.category)} className={activeCategory === cat.category ? styles.activeCat : ''}>
                                {cat.category}
                            </h3>
                            {activeCategory === cat.category && (
                                <ul className={styles.endpointList}>
                                    {cat.items.map(item => (
                                        <li
                                            key={item.name}
                                            className={`${styles.navItem} ${activeEndpoint === item ? styles.activeItem : ''}`}
                                            onClick={() => setActiveEndpoint(item)}
                                        >
                                            <span className={`${styles.methodBadge} ${styles[item.method]}`}>{item.method}</span>
                                            {item.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </nav>
            </aside>

            <main className={styles.main}>
                <div className={styles.header}>
                    <h1>{activeEndpoint.name}</h1>
                    <p>{activeEndpoint.desc}</p>
                </div>

                <div className={styles.endpointBar}>
                    <span className={`${styles.methodBadgeLarge} ${styles[activeEndpoint.method]}`}>{activeEndpoint.method}</span>
                    <code className={styles.url}>{activeEndpoint.path}</code>
                </div>

                <div className={styles.section}>
                    <h3>Example Request</h3>
                    <div className={styles.codeBlock}>
                        <div className={styles.codeHeader}>
                            <span>JavaScript (Fetch)</span>
                            <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText("Code copy logic here...")}>
                                <Copy size={14} /> Copy
                            </button>
                        </div>
                        <pre>
                            {`fetch('${activeEndpoint.path.replace(':id', '12345')}', {
    method: '${activeEndpoint.method}',
    headers: {
        'Content-Type': 'application/json'
    }${activeEndpoint.method === 'POST' ? `,
    body: JSON.stringify({
        // Payload here
    })` : ''}
})
.then(response => response.json())
.then(data => console.log(data));`}
                        </pre>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default APIDocs;
